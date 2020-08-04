import { SagaIterator, Task } from 'redux-saga';
import { connectionWorker, connectionClient } from '../store/actions';
import handleWorkerConnection from './worker';
import { take } from '../../common/utils/effects';
import { spawn, fork, join, call } from 'redux-saga/effects';
import handlePersist from './persist';
import taskDistributer from './worker/taskDistributer';
import handlePlatformTasks from './platformTasks';
import stdinReader from './stdin';
import handleClientConnection from './client';

function* spawnHelper(toKill: Task | undefined, action: ReturnType<typeof connectionWorker>) {
	if (toKill) {
		try {
			yield join(toKill);
		} catch(_) {};
	}
	yield call(handleWorkerConnection, action.payload);
}

function* startWorkerListener(): SagaIterator {
	const map: Map<string, Task> = new Map();
	while (true) {
		const action: ReturnType<typeof connectionWorker> = yield take(connectionWorker);
		const existingTask = map.get(action.payload.workerToken);
		const newTask = yield spawn(spawnHelper, existingTask, action);
		action.payload.webSocket.addEventListener('close', () => {
			const task = map.get(action.payload.workerToken);
			if (task === newTask) {
				map.delete(action.payload.workerToken);
			}
		});
	}
}

function* startClientListener(): SagaIterator {
	while (true) {
		const action: ReturnType<typeof connectionClient> = yield take(connectionClient);
		yield fork(handleClientConnection, action);
	}
}

export default function* mainSaga(): SagaIterator {
	yield fork(startClientListener);
	yield fork(handlePersist);
	yield fork(startWorkerListener);
	yield fork(taskDistributer);
	yield fork(handlePlatformTasks);
	yield fork(stdinReader);
}
