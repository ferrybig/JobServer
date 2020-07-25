import { State } from './reducer';
import { PersistState } from './types';
import {selectors as crudSelectors} from './crud'
import {CrudState} from '../../common/utils/crudStore';

export const get = crudSelectors.get;
export const getOrNull = crudSelectors.getOrNull;
export const exists = crudSelectors.exists;
export const allKeys = crudSelectors.allKeys;
export const size = crudSelectors.size;
export const find = crudSelectors.find;
export const filter = crudSelectors.filter;

export function computePersistState(state: State): PersistState {
	function map<E, I extends string | number>(state: CrudState<E, I>): E[] {
		return state.byId.map(i => state.entities[i]!);
	}
	return {
		workers: map(state.workers),
		taskInformation: map(state.taskInformation),
		task: map(state.task),
		repo: map(state.repo),
		deploymentInformation: map(state.deploymentInformation),
		deployment: map(state.deployment),
		pendingFiles: map(state.pendingFiles),
	}
}