import { SagaIterator } from 'redux-saga';
import { call, apply } from 'redux-saga/effects';
import UpstreamConnection from '../UpstreamConnection';
import { BuildTask } from '../../common/types';
import TaskRunner from '../taskRunner';
import { tmpFile } from '../../common/async/tmp';
import debounce from '../../common/utils/debounce';

export default function* buildSaga(
	workerUrl: string,
	taskRunner: TaskRunner,
): SagaIterator<never> {
	const connection: UpstreamConnection = yield call((url: string) => new UpstreamConnection(url), workerUrl);
	try {
		while (true) {
			const task: BuildTask = yield apply(connection, 'requestTask', []);
			console.log('Worker picked up task: ' + task.id);
			const [closeOutput, outputFile]: [() => void, string] = yield call(tmpFile);
			try {
				let shouldSend = true;
				const logger = debounce((logEntry: string) => connection.addTaskLog(logEntry, shouldSend), 500, ([a], [b]): [string] => [b + a]);
				try {
					yield apply(taskRunner, 'run', [task, outputFile, logger]);
				} finally {
					shouldSend = false;
					logger.flush();
				}
				yield apply(connection, 'uploadSuccessResult', [outputFile]);
			} catch(e) {
				yield apply(connection, 'addTaskLog', [`\n${e}\n${e?.stack}`]);
				yield apply(connection, 'uploadErrorResult', []);
			} finally {
				yield call(closeOutput);
			}
			console.log('Worker fnished task: ' + task.id);
		}
	} finally {
		yield apply(connection, 'close', []);
	}
}
