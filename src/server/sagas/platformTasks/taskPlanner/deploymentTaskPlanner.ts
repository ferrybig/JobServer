import {SagaIterator, channel} from "redux-saga";
import {v4 as uuid} from 'uuid';
import {PlatformTask} from "../../../store/types";
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

function* planDeployment(): SagaIterator<void> {
	const hasDeployment: null | PlatformTask = yield select(find, 'platformTask', { status: 'pending', type: 'deployment'});
	if (!hasDeployment) {
		const lastDeployment: PlatformTask[] = yield select(filter, 'platformTask', { type: 'deployment'});
		if (checkLastXMatching(lastDeployment, 3, e => e.status === 'error')) {
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

export default function* deploymentTaskPlanner(): SagaIterator<never> {
	let deploymentState = yield select(getDeploymentNumbers);
	while (true) {
		const a: EVENTS_CHILD = yield take(EVENTS_CHILD);
		if (a.type === 'update') {
			if (a.module === 'deployment') {
				const newDeploymentState = yield select(getDeploymentNumbers);
				if (!shallowEquals(deploymentState, newDeploymentState)) {
					deploymentState = newDeploymentState;
					// Continue with the deployment
				} else {
					continue;
				}
			} else {
				continue;
			}
		} else if (a.type === 'triggerPlatformTask') {
			// Continue with the deployment
		} else {
			return assertNever(a);
		}
		yield call(planDeployment);
	}
}
