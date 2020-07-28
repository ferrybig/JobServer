import { State } from './reducer';
import { PersistStateV1, Task } from './types';
import {selectors as crudSelectors} from './crud'
import {CrudState} from '../../common/utils/crudStore';
import {BuildTask} from '../../common/types';

export const get = crudSelectors.get;
export const getOrNull = crudSelectors.getOrNull;
export const exists = crudSelectors.exists;
export const allKeys = crudSelectors.allKeys;
export const size = crudSelectors.size;
export const find = crudSelectors.find;
export const filter = crudSelectors.filter;

export function computePersistState(state: State): PersistStateV1 {
	function map<E, I extends string | number>(state: CrudState<E, I>): E[] {
		return state.byId.map(i => state.entities[i]!);
	}
	return {
		version: 'v1',
		workers: map(state.workers),
		taskInformation: map(state.taskInformation),
		task: map(state.task),
		repo: map(state.repo),
		deploymentInformation: map(state.deploymentInformation),
		deployment: map(state.deployment),
		pendingFiles: map(state.pendingFiles),
		site: map(state.site),
	}
}

export function taskToBuildTask(state: Pick<State, 'taskInformation' | 'deployment' | 'repo' | 'deploymentInformation'>, task: Task): BuildTask  {
	const taskInformation = get(state, 'taskInformation', task.taskInformationId);
	const deployment = get(state, 'deployment', task.deploymentId);
	const deploymentInformation = get(state, 'deploymentInformation', deployment.deploymentInformationId);
	const repo = get(state, 'repo', deploymentInformation.repoId);
	return {
		id: task.id,
		buildScript: taskInformation.buildScript,
		repo: {
			url: repo.url,
			commit: deployment.commit,
			branch: deployment.branch,
		}
	}
}

export function findNextPendingTask(state: Pick<State, 'task'>): Task | null {
	const allIds = allKeys(state, 'task');
	// Newer tasks hould be more important, might want to add a config flag for this
	for (let i = allIds.length - 1; i >= 0; i--) {
		const task = get(state, 'task', allIds[i]);
		if (task.status === 'approved' && task.workerId === null) {
			return task;
		}
	}
	return null;
}
