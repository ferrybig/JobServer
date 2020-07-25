import NodeWebSocket from 'ws';
import {CallEffect, call, fork, put, select} from 'redux-saga/effects';
import {SagaIterator, EventChannel, Channel} from 'redux-saga';
import {TaskRequest, TaskFinished, TaskError, WorkerToServerPacket, ServerToWorkerPacket, PingPacket} from '../../../common/packets';
import {Worker, Task} from '../../store/types';
import makeWebSocketChannel from '../../../common/sagas/makeWebSocketConnection';
import timeoutHandler from './timeoutHandler';
import {workerDisconnected, crudUpdate, crudConcat} from '../../store/actions';
import {getOrNull, get} from '../../store/selectors';
import {take} from '../../../common/utils/effects';
import assertNever from '../../../common/utils/assertNever';
import {BuildTask} from '../../../common/types';
import {stat} from '../../../common/async/fs';
import {Stats} from 'fs';

type FilterAway<B, T> = B extends T ? never : B;

type WorkerToServerPacketNoPing = FilterAway<WorkerToServerPacket, PingPacket>;

function* receivePacket(socket: Socket): SagaIterator<WorkerToServerPacketNoPing> {
	while(true) {
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
function* getOrCreatePendingFileForTask(task: Task) {
	if (task.outputFile === null) {
		throw new Error('Cannot create pending file for null output');
	}
}

interface Socket {
	incoming: EventChannel<string>,
	outgoing: Channel<string>,
	worker: Worker,
}
function* disconnectInvalidSequence(socket: Socket, packet: WorkerToServerPacket): SagaIterator<never> {
	throw new Error('Connection for worker ' + socket.worker.id + ' send invalid packet: ' + JSON.stringify(packet))
}
function* handlePing(socket: Socket, packet: PingPacket): SagaIterator<void> {
	yield call(sendPacket, socket, {
		type: 'pong'
	});
}

function* handleWaitingForTask(socket: Socket, packet: TaskRequest): SagaIterator<CallEffect> {
	// await
	yield call(sendPacket, socket, {
		type: 'taskReceived',
		payload: {
			task: {} as unknown as BuildTask, // TODO
		}
	});
	return call(handleRunningTask, socket);

}
function* handleRunningTask(socket: Socket, task: Task): SagaIterator<CallEffect> {
	// TODO update task
	while(true) {
		const packet: WorkerToServerPacketNoPing = yield call(receivePacket, socket);
		switch (packet.type) {
			case 'taskProgressAppend':
				yield put(crudConcat('task', {
					id: task.id,
					field: 'log',
					data: packet.payload.logPart,
				}))
				break;
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

}
function* handleUploadingTask(socket: Socket, task: Task, packet: TaskFinished): SagaIterator<CallEffect> {
	yield put(crudUpdate('task', {
		id: task.id,
		data: {
			log: packet.payload.log,
		},
	}));
	if (packet.payload.fileSize > 0 && task.outputFile !== null) {
		if (task.status === 'running') {
			yield put(crudUpdate('task', {
				id: task.id,
				data: {
					status: 'uploading'
				},
			}))
		}
		const stats: Stats = yield call(stat, task.outputFile);
		yield call(sendPacket, socket, {
			type: 'taskStartUpload',
			payload: {
				taskId: task.id,
				offset: stats.size,
				url: 'http://...',
			}
		});
		// TODO update task
		// TODO wait until uploading finishes
	}
	yield put(crudUpdate('task', {
		id: task.id,
		data: {
			status: 'success',
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
			taskId: '0',
		}
	});
	return call(handleIdleTask, socket);
}
function* handleErrorTask(socket: Socket, task: Task, packet: TaskError): SagaIterator<CallEffect> {
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
	const currentTask: Task | null = currentTaskId !== null ? yield select(getOrNull, 'task', currentTaskId) : null
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

export default function* handleWorkerConnection(data: { webSocket: NodeWebSocket, ip: string, workerToken: string }) {
	const worker: Worker | undefined = yield select(getOrNull, 'workers', data.workerToken);
	if (!worker) {
		data.webSocket.terminate();
		return;
	}
	const [incoming, outgoing]: [EventChannel<string>, Channel<string>] = yield call(makeWebSocketChannel, data.webSocket);
	try {
		yield fork(timeoutHandler, data.webSocket, outgoing);
		let handler = call(handleInitTask, {
			incoming,
			outgoing,
			worker,
		});
		while (handler) {
			handler = yield handler;
		}
	} catch(e) {
		console.error(e); // todo yield action
	} finally {
		yield put(workerDisconnected(data.workerToken));
		data.webSocket.terminate();
		outgoing.close();
		incoming.close();
	}
}