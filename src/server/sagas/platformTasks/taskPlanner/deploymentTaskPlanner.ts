import {SagaIterator, channel} from "redux-saga";
import {v4 as uuid} from 'uuid';
import {PlatformTask} from "../../../../common/types";
import {find, filter, getDeploymentNumbers} from "../../../store/selectors";
import {select, put, call} from "redux-saga/effects";
import {crudPersist, crudUpdate, triggerPlatformTask} from "../../../store/actions";
import {take} from "../../../../common/utils/effects";
import assertNever from "../../../../common/utils/assertNever";

function shallowEquals<T>(a: readonly T[], b: readonly T[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}


const EVENTS_CHILD = [
	crudUpdate,
	triggerPlatformTask,
];
type EVENTS_CHILD = ReturnType<typeof EVENTS_CHILD[number]>;

function checkLastXMatching<T>(array: T[], x: number, test: (input: T) => boolean): boolean {
	if (array.length < x) {
		return false;
	}
	for (let i = array.length - 1; i >= 0; i--) {
		if (!test(array[i])) {
			return false;
		}
	}
	return true;
}

function* planDeployment(force: boolean): SagaIterator<void> {
	const hasDeployment: null | PlatformTask = yield select(find, 'platformTask', { status: 'pending', type: 'deployment'});
	if (!hasDeployment) {
		const lastDeployment: PlatformTask[] = yield select(filter, 'platformTask', { type: 'deployment'});
		if (checkLastXMatching(lastDeployment, 3, e => e.status === 'error') && !force) {
			console.warn('Skipping creation of platformtak of type deployment because the last run was an error, manual invocation is required ');
			return;
		}
		yield put(crudPersist('platformTask', {
			id: uuid(),
			type: 'deployment',
			status: 'pending',
			log: '',
			warnings: '',
			startTime: 0,
			endTime: 0,
		}));
	}
}

function* shouldStartDeployment(a: EVENTS_CHILD, localState: { numbers: ReturnType<typeof getDeploymentNumbers>}): SagaIterator<boolean | 'force'> {
	switch (a.type) {
		case 'update':
			if (a.module === 'deployment') {
				const newDeploymentState = yield select(getDeploymentNumbers);
				if (!shallowEquals(localState.numbers, newDeploymentState)) {
					localState.numbers = newDeploymentState;
					return true;
				}
			}
			return false;
		case 'triggerPlatformTask':
			return 'force';
		default:
			return assertNever(a);
	}
}

export default function* deploymentTaskPlanner(): SagaIterator<never> {
	const localState: { numbers: ReturnType<typeof getDeploymentNumbers>} = { numbers: [] };
	localState.numbers = yield yield select(getDeploymentNumbers);
	while (true) {
		const a: EVENTS_CHILD = yield take(EVENTS_CHILD);
		const should: boolean | 'force' = yield call(shouldStartDeployment, a, localState);
		if (should) {
			yield call(planDeployment, should === 'force');
		}
	}
}
