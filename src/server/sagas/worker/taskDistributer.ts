import { select, put } from 'redux-saga/effects';
import { Worker, Task } from '../../../common/types';
import { crudUpdate, workerAwaitsTask, workerDisconnected } from '../../store/actions';
import { take } from '../../../common/sagas/effects';
import { findNextPendingTask } from '../../store/selectors';
import assertNever from '../../../common/utils/assertNever';

const EVENTS_CHILD = [
	crudUpdate,
	workerAwaitsTask,
	workerDisconnected,
];
type EVENTS_CHILD = ReturnType<typeof EVENTS_CHILD[number]>;

function getAny<T>(set: Set<T>): T {
	for (const e of set) {
		set.delete(e);
		return e;
	}
	throw new Error('Set is empty');
}

export default function* taskDistributer(timestampService: () => number = () => Date.now()) {
	const set = new Set<Worker['id']>();
	let hasNewTasks = true;
	while (true) {
		const action: EVENTS_CHILD = yield take(EVENTS_CHILD);
		switch (action.type) {
			case 'update':
				if (action.module === 'task') {
					if ((action.payload.data as Partial<Task>).status === 'approved') {
						hasNewTasks = true;
					}
				}
				break;
			case 'workerAwaitsTask':
				set.add(action.payload);
				break;
			case 'workerDisconnected':
				set.delete(action.payload);
				break;
			default:
				return assertNever(action);
		}
		while (hasNewTasks && set.size > 0) {
			const newTask: Task | null = yield select(findNextPendingTask);
			if (!newTask) {
				hasNewTasks = false;
			} else {
				const worker = getAny(set);
				yield put(crudUpdate('task', {
					id: newTask.id,
					data: {
						status: 'running',
						workerId: worker,
						startTime: timestampService(),
					},
				}));
				yield put(crudUpdate('workers', {
					id: worker,
					data: {
						currentTask: newTask.id,
					},
				}));
			}
		}
	}
}
