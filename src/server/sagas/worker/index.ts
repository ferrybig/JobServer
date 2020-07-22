import NodeWebSocket from 'ws';
import {CallEffect, call, fork, put, select} from 'redux-saga/effects';
import {SagaIterator, EventChannel, Channel} from 'redux-saga';
import {TaskRequest, TaskFinished, TaskError, WorkerToServerPacket, ServerToWorkerPacket, PingPacket} from '../../../common/packets';
import {Worker, Task} from '../../store/types';
import makeWebSocketChannel from '../../../common/sagas/makeWebSocketConnection';
import timeoutHandler from './timeoutHandler';
import {workerDisconnected} from '../../store/actions';
import {getWorkerGetOrNull} from '../../store/selectors';
import {take} from '../../../common/utils/effects';
import assertNever from '../../../common/utils/assertNever';
import {BuildTask} from '../../../common/types';

function* receivePacket(socket: Socket): SagaIterator<WorkerToServerPacket> {
	return JSON.parse(yield take(socket.incoming));
}
function* sendPacket(socket: Socket, packet: ServerToWorkerPacket): SagaIterator<void> {
	yield put(socket.outgoing, JSON.stringify(packet));
}

interface Socket {
	incoming: EventChannel<string>,
	outgoing: Channel<string>,
	worker: Worker,
	task: Task | null,
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
function* handleRunningTask(socket: Socket): SagaIterator<CallEffect> {
	// TODO update task
	while(true) {
		const packet: WorkerToServerPacket = yield call(receivePacket, socket);
		switch (packet.type) {
			case 'ping':
				yield call(handlePing, socket, packet);
				break;
			case 'taskProgressAppend':
				// TODO update task
				break;
			case 'taskFinished':
				return call(handleUploadingTask, socket, packet);
			case 'taskError':
				return call(handleErrorTask, socket, packet);
			case 'taskRequest':
				return call(disconnectInvalidSequence, socket, packet);
			default:
				return assertNever(packet);
		}
	}

}
function* handleUploadingTask(socket: Socket, packet: TaskFinished): SagaIterator<CallEffect> {
	yield call(sendPacket, socket, {
		type: 'taskStartUpload',
		payload: {
			taskId: '0',
			offset: 0,
			url: 'http://...',
		}
	});
	// TODO update task
	// TODO wait until uploading finishes
	yield call(sendPacket, socket, {
		type: 'taskResultUploaded',
		payload: {
			taskId: '0',
		}
	});
	return call(handleIdleTask, socket);
}
function* handleErrorTask(socket: Socket, packet: TaskError): SagaIterator<CallEffect> {

}
function* handleIdleTask(socket: Socket): SagaIterator<CallEffect> {
	while(true) {
		const packet: WorkerToServerPacket = yield call(receivePacket, socket);
		switch (packet.type) {
			case 'ping':
				yield call(handlePing, socket, packet);
				break;
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
}
function* handleInitTask(socket: Socket): SagaIterator<CallEffect> {
	while(true) {
		const packet: WorkerToServerPacket = yield call(receivePacket, socket);
		switch (packet.type) {
			case 'ping':
				yield call(handlePing, socket, packet);
				break;
			case 'taskRequest':
				return call(handleWaitingForTask, socket, packet);
			case 'taskFinished':
				return call(handleUploadingTask, socket, packet);
			case 'taskError':
				return call(handleErrorTask, socket, packet);
			case 'taskProgressAppend':
				return call(disconnectInvalidSequence, socket, packet);
			default:
				return assertNever(packet);
		}
	}
}

export default function* handleWorkerConnection(data: { webSocket: NodeWebSocket, ip: string, workerToken: string }) {
	const worker: Worker | undefined = yield select(getWorkerGetOrNull, data.workerToken);
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