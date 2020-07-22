import {SagaIterator, Task} from "redux-saga";
import {connectionWorker} from "../store/actions";
import handleWorkerConnection from "./worker";
import {take} from "../../common/utils/effects";
import {spawn, fork, join, call} from "redux-saga/effects";
import handlePersist from "./persist";

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
	while(true) {
		const action: ReturnType<typeof connectionWorker> = yield take(connectionWorker);
		const existingTask = map.get(action.payload.workerToken);
		const newTask = yield spawn(spawnHelper, existingTask, action);
		action.payload.webSocket.addEventListener('close', () => {
			const task = map.get(action.payload.workerToken);
			if (task === newTask) {
				map.delete(action.payload.workerToken)
			}
		});
	}
}

export default function* mainSaga(): SagaIterator {
	yield fork(handlePersist);
	yield fork(startWorkerListener);
}
