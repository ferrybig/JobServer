import { PlatformTask } from '../../../common/types';
import { fork, select, put, call, StrictEffect } from 'redux-saga/effects';
import { find, filter } from '../../store/selectors';
import { crudUpdate, crudPersist, crudConcat } from '../../store/actions';
import { SagaIterator, eventChannel, buffers } from 'redux-saga';
import { take } from '../../../common/utils/effects';
import actionMatching from '../../../common/store/actionMatching';
import TaskOptions from './taskOptions';
import handleDeploymentTask from './deployment';
import assertNever from '../../../common/utils/assertNever';
import taskPlanner from './taskPlanner';
import debounce from '../../../common/utils/debounce';

type MessageType = {
	type: 'log';
	data: string;
} | {
	type: 'warning';
	data: Error;
} | {
	type: 'final-error';
	data: Error;
} | {
	type: 'final';
	data: StrictEffect | null;
}

const STRING_CONCAT = ([a]: [string], [b]: [string]): [string] => [b + a];

function debouncedTaskOptions(options: TaskOptions): TaskOptions & { flush(): void } {
	const logger = debounce(options.logger, 500, STRING_CONCAT);
	return {
		...options,
		logger,
		flush() {
			logger.flush();
		}
	};
}

function* executeTask(task: PlatformTask, timestampService: () => number = () => Date.now()): SagaIterator  {
	try {
		const channel = eventChannel<MessageType>((emit) => {
			const options = debouncedTaskOptions({
				logger: (data) => emit({ type: 'log', data }),
				warnings: (data) => emit({ type: 'warning', data }),
				abortSignal: { aborted: false },
			});
			let promise: Promise<StrictEffect>;
			switch (task.type) {
				case 'deployment':
					promise = handleDeploymentTask(task, options);
					break;
				default:
					promise = assertNever(task.type);
			}
			promise.finally(() => options.flush()).then((d) => emit({
				type: 'final',
				data: d,
			}), (e: Error) => emit({
				type: 'final-error',
				data: e,
			}));
			return () => {
				options.abortSignal.aborted = true;
			};
		}, buffers.expanding(10));
		let hasEnded = false;
		try {
			do {
				const packet: MessageType = yield take(channel);
				switch (packet.type) {
					case 'log':
						yield put(crudConcat('platformTask', {
							id: task.id,
							field: 'log',
							data: packet.data,
						}));
						break;
					case 'warning':
						yield put(crudConcat('platformTask', {
							id: task.id,
							field: 'warnings',
							data: '\n' + packet.data + '\n' + packet.data?.stack + '\n',
						}));
						break;
					case 'final':
						hasEnded = true;
						if (packet.data) {
							yield packet.data;
						}
						break;
					case 'final-error':
						hasEnded = true;
						throw packet.data;
					default:
						return assertNever(packet);
				}
			} while (!hasEnded);
		} finally {
			channel.close();
		}
		yield put(crudUpdate('platformTask', {
			id: task.id,
			data: {
				status: 'success',
				endTime: timestampService(),
			},
		}));
	} catch(e) {
		console.warn('Task deployment error', e);
		yield put(crudConcat('platformTask', {
			id: task.id,
			field: 'log',
			data: '\n' + e + '\n' + e?.stack + '\n'
		}));
		yield put(crudUpdate('platformTask', {
			id: task.id,
			data: {
				status: 'error',
				endTime: timestampService(),
			},
		}));
	}
}
function* taskWatcher(timestampService: () => number = () => Date.now()): SagaIterator {
	const failedTasks: PlatformTask[] = yield select(filter, 'platformTask', { status: 'running' });
	for (const failed of failedTasks) {
		yield put(crudUpdate('platformTask', {
			id: failed.id,
			data: {
				log: failed.log += '\n\nTask terminated unexpectecly...\n',
				status: 'error',
				endTime: timestampService(),
			}
		}));
	}
	yield fork(taskPlanner);
	while (true) {
		const task: PlatformTask | null = yield select(find, 'platformTask', { status: 'pending' });
		if (task) {
			yield put(crudUpdate('platformTask', {
				id: task.id,
				data: {
					status: 'running',
					startTime: timestampService(),
				}
			}));
			yield call(executeTask, task);
			continue;
		}
		yield take(actionMatching<ReturnType<typeof crudPersist>>(crudPersist, a => a.module === 'platformTask'));
	}
}

export default function* handlePlatformTasks() {
	yield fork(taskWatcher);
}
