import { SagaIterator } from 'redux-saga';
import { fork, spawn, call } from 'redux-saga/effects';
import buildSaga from './build';
import TaskRunner from '../taskRunner';
import RepoAccessor from '../RepoAccessor';

function* spawnWorker(workerUrl: string, taskRunner: TaskRunner): SagaIterator {
	yield call(buildSaga, workerUrl, taskRunner);
}
function* spawnWorkers(): SagaIterator {
	const workers = ['http://localhost:5000/worker/111'];
	const repoPath = '/home/fernando/Documents/Dev/Private/JobServer/repos';
	const repoAccessor: RepoAccessor = yield call((repoPath: string) => new RepoAccessor(repoPath), repoPath);
	const taskRunner: TaskRunner = yield call((repoAccessor: RepoAccessor) => new TaskRunner(repoAccessor), repoAccessor);

	for (const worker of workers) {
		yield spawn(spawnWorker, worker, taskRunner);
	}
}

export default function* mainSaga(): SagaIterator {
	yield fork(spawnWorkers);
}
