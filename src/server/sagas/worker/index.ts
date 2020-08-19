import { CallEffect, call, fork, put, select, cancel } from 'redux-saga/effects';
import { SagaIterator, EventChannel, Channel } from 'redux-saga';
import { Stats } from 'fs';
import { v4 as uuid } from 'uuid';
import { TaskRequest, TaskFinished, TaskError, WorkerToServerPacket, ServerToWorkerPacket, PingPacket, Stop } from '../../../common/packets/workerPackets';
import { Worker, Task, PendingUploadedFile, Deployment } from '../../../common/types';
import makeWebSocketChannel from '../../../common/sagas/makeWebSocketConnection';
import timeoutHandler from '../timeoutHandler';
import { workerDisconnected, crudUpdate, crudConcat, crudPersist, connectionWorker, crudDelete, workerAwaitsTask } from '../../store/actions';
import { getOrNull, get, find, filter, taskToBuildTask } from '../../store/selectors';
import { take } from '../../../common/utils/effects';
import assertNever from '../../../common/utils/assertNever';
import { BuildTask } from '../../../common/types';
import { stat, truncate } from '../../../common/async/fs';
import actionMatching from '../../../common/store/actionMatching';
import pickFirstNonNullCount from '../../../common/utils/pickFirstNonNullCount';

type FilterAway<B, T> = B extends T ? never : B;

type WorkerToServerPacketNoPing = FilterAway<WorkerToServerPacket, PingPacket>;

function* receivePacket(socket: Socket): SagaIterator<WorkerToServerPacketNoPing> {
	while (true) {
		const packet: WorkerToServerPacket = JSON.parse(yield take(socket.incoming));
		if (packet.type !== 'ping') {
			return packet;
		}
		yield call(handlePing, socket, packet);
	}
}
function* sendPacket(socket: Socket, packet: ServerToWorkerPacket): SagaIterator<void> {
	yield put(socket.outgoing, JSON.stringify(packet));
}

function* pingHandler(socket: Socket): SagaIterator<never> {
	const packet = yield call(receivePacket, socket);
	throw new Error('Expected only pong packets at this moment: ' + packet);
}

function* tryUpdateDeployment(deploymentId: Deployment['id']) {
	const deployment: Deployment = yield select(get, 'deployment', deploymentId);
	const subTasks: Task[] = yield select(s => filter(s, 'task', t => t.deploymentId === deploymentId));
	const newStatus: Deployment['status'] = pickFirstNonNullCount(subTasks, 'status', {
		init: 'pending',
		success: 'success',
		error: 'error',
		cancelled: 'cancelled',
		approved: 'pending',
		running: 'pending',
		uploading: 'pending',
		timeout: 'error',
	}, ['error', 'pending', 'cancelled', 'success'] as const, 'pending' as const)[0];
	// TLDR: If all tasks are success, the deployment is a success, if any task is cancelled/errored/timedout, the deployment is a failure
	if (newStatus !== deployment.status) {
		yield put(crudUpdate('deployment', {
			id: deploymentId,
			data: {
				status: newStatus
			},
		}));
	}
}
function* getOrCreatePendingFileForFile(outputFile: string, fileSize: number): SagaIterator<PendingUploadedFile> {
	const pendingFile: PendingUploadedFile | null = yield select(s => find(s, 'pendingFile', (file: PendingUploadedFile) => file.outputFile === outputFile));
	if (pendingFile) {
		if (pendingFile.fileSize !== fileSize) {
			yield put(crudUpdate('pendingFile', {
				id: pendingFile.token,
				data: {
					fileSize: fileSize,
				},
			}));
			yield call(truncate, outputFile, 0);
		}
		return pendingFile;
	}
	const newPendingFile: PendingUploadedFile = {
		token: uuid(),
		outputFile,
		fileSize,
	};
	yield put(crudPersist('pendingFile', newPendingFile));
	return newPendingFile;
}

interface Socket {
	incoming: EventChannel<string>;
	outgoing: Channel<string>;
	worker: Worker;
	baseUrl: string;
}
function disconnectInvalidSequence(socket: Socket, packet: WorkerToServerPacket): never {
	throw new Error('Connection for worker ' + socket.worker.id + ' send invalid packet: ' + JSON.stringify(packet));
}
function* handlePing(socket: Socket, packet: PingPacket): SagaIterator<void> {
	yield call(sendPacket, socket, {
		type: 'pong'
	});
}

function* handleWaitingForTask(socket: Socket, packet: TaskRequest): SagaIterator<CallEffect> {
	while (true) {
		const worker: Worker = yield select(get, 'workers', socket.worker.id);
		socket.worker = worker;
		if (worker.currentTask !== null) {
			break;
		}
		yield put(workerAwaitsTask(worker.id));

		const packetHandler = yield fork(pingHandler, socket);
		try {
			yield take(actionMatching(crudUpdate, a => a.module === 'workers' && a.payload.id === worker.id));
		} finally {
			yield cancel(packetHandler);
		}
	}
	// await
	const task: Task = yield select(get, 'task', socket.worker.currentTask);
	const buildTask: BuildTask = yield select(taskToBuildTask, task);
	yield call(sendPacket, socket, {
		type: 'taskReceived',
		payload: {
			task: buildTask, // TODO
		},
	});
	return call(handleRunningTask, socket, task);

}
function* handleRunningTask(socket: Socket, task: Task): SagaIterator<CallEffect> {
	const packet: WorkerToServerPacketNoPing = yield call(receivePacket, socket);
	switch (packet.type) {
		case 'taskProgressAppend':
			yield put(crudConcat('task', {
				id: task.id,
				field: 'log',
				data: packet.payload.logPart,
			}));
			return call(handleRunningTask, socket, task);
		case 'taskFinished':
			return call(handleUploadingTask, socket, task, packet);
		case 'taskError':
			return call(handleErrorTask, socket, task, packet);
		case 'taskRequest':
			return call(disconnectInvalidSequence, socket, packet);
		default:
			return assertNever(packet);
	}
}
function* handleUploadingTask(socket: Socket, task: Task, packet: TaskFinished, timestampService: () => number = () => Date.now()): SagaIterator<CallEffect> {
	yield put(crudUpdate('task', {
		id: task.id,
		data: {
			log: packet.payload.log,
			buildTime: timestampService(),
		},
	}));
	if (packet.payload.fileSize > 0 && task.outputFile !== null) {
		if (task.status === 'running') {
			yield put(crudUpdate('task', {
				id: task.id,
				data: {
					status: 'uploading'
				},
			}));
		}
		const pendingFile: PendingUploadedFile = yield call(getOrCreatePendingFileForFile, task.outputFile, packet.payload.fileSize);
		let currentSize: number;
		try {
			const stats: Stats = yield call(stat, task.outputFile);
			currentSize = stats.size;
		} catch(_) {
			currentSize = 0;
		}
		if (currentSize < pendingFile.fileSize) {
			yield call(sendPacket, socket, {
				type: 'taskStartUpload',
				payload: {
					taskId: task.id,
					offset: currentSize,
					url: socket.baseUrl + 'uploads/' + pendingFile.token,
				}
			});
			const packetHandler = yield fork(pingHandler, socket);
			try {
				yield take(actionMatching(crudDelete, (a) => a.module === 'pendingFile' && a.payload === pendingFile.token));
			} finally {
				yield cancel(packetHandler);
			}
			// Our pending task got deleted, we are done uploading
			const updatedTask: Task = yield select(get, 'task', task.id);
			if (updatedTask.status !== 'uploading') {
				// Task timed out or something else happened!
				throw new Error('Task got modified beyond our control, status is "' + updatedTask.status + '" while we expected it to be "uploading"');
			}
		} else {
			yield put(crudDelete('pendingFile', pendingFile.token));
		}
	}
	yield put(crudUpdate('task', {
		id: task.id,
		data: {
			status: 'success',
			endTime: timestampService(),
		},
	}));
	yield put(crudUpdate('workers', {
		id: socket.worker.id,
		data: {
			currentTask: null,
		}
	}));
	yield call(sendPacket, socket, {
		type: 'taskResultUploaded',
		payload: {
			taskId: task.id,
		}
	});
	yield call(tryUpdateDeployment, task.deploymentId);
	return call(handleIdleTask, socket);
}
function* handleErrorTask(socket: Socket, task: Task, packet: TaskError, timestampService: () => number = () => Date.now()): SagaIterator<CallEffect> {
	yield put(crudUpdate('task', {
		id: task.id,
		data: {
			status: 'error',
			log: packet.payload.log,
			endTime: timestampService(),
			buildTime: timestampService(),
		},
	}));
	yield put(crudUpdate('workers', {
		id: socket.worker.id,
		data: {
			currentTask: null,
		}
	}));
	const worker: Worker = yield select(get, 'workers', socket.worker.id);
	yield call(sendPacket, socket, {
		type: 'taskResultUploaded',
		payload: {
			taskId: task.id,
		}
	});
	yield call(tryUpdateDeployment, task.deploymentId);
	return call(handleIdleTask, {
		...socket,
		worker,
	});
}
function* handleIdleTask(socket: Socket): SagaIterator<CallEffect> {
	const packet: WorkerToServerPacketNoPing = yield call(receivePacket, socket);
	switch (packet.type) {
		case 'taskRequest':
			return call(handleWaitingForTask, socket, packet);
		case 'taskFinished':
		case 'taskError':
		case 'taskProgressAppend':
			return call(disconnectInvalidSequence, socket, packet);
		default:
			return assertNever(packet);
	}
}
function* handleNoTaskAfterSubmit(socket: Socket, packet: TaskError | TaskFinished): SagaIterator<CallEffect> {
	// The server has recorded that the worker is done with the task, the worker never got the confirmation.
	yield call(sendPacket, socket, {
		type: 'taskResultUploaded',
		payload: {
			taskId: packet.payload.taskId,
		}
	});
	return call(handleIdleTask, socket);
}
function* handleInitTask(socket: Socket): SagaIterator<CallEffect> {

	const currentTaskId = socket.worker.currentTask;
	const currentTask: Task | null = currentTaskId !== null ? yield select(getOrNull, 'task', currentTaskId) : null;
	const packet: WorkerToServerPacketNoPing = yield call(receivePacket, socket);
	switch (packet.type) {
		case 'taskRequest':
			return call(handleWaitingForTask, socket, packet);
		case 'taskFinished':
			if (!currentTask) {
				return call(handleNoTaskAfterSubmit, socket, packet);
			}
			return call(handleUploadingTask, socket, currentTask, packet);
		case 'taskError':
			if (!currentTask) {
				return call(handleNoTaskAfterSubmit, socket, packet);
			}
			return call(handleErrorTask, socket, currentTask, packet);
		case 'taskProgressAppend':
			return call(disconnectInvalidSequence, socket, packet);
		default:
			return assertNever(packet);
	}
}

export default function* handleWorkerConnection(data: ReturnType<typeof connectionWorker>['payload']) {
	const worker: Worker | undefined = yield select(getOrNull, 'workers', data.workerToken);
	if (!worker) {
		const packet: Stop = {
			type: 'stop',
			payload: {
				time: 0,
			}
		};
		data.webSocket.send(JSON.stringify(packet));
		data.webSocket.close();
		return;
	}
	const [incoming, outgoing]: [EventChannel<string>, Channel<string>] = yield call(makeWebSocketChannel, data.webSocket);
	try {
		yield fork(timeoutHandler, data.webSocket);
		let handler = call(handleInitTask, {
			incoming,
			outgoing,
			worker,
			baseUrl: data.baseUrl,
		});
		while (handler) {
			handler = yield handler;
		}
	} catch(e) {
		console.error('Worker error!', e); // todo yield action
	} finally {
		yield put(workerDisconnected(data.workerToken));
		data.webSocket.terminate();
		outgoing.close();
		incoming.close();
	}
}
