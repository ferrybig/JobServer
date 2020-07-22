import { State } from './reducer';
import { keySelector } from '../../common/utils/keySelector';
import deploymentInformation from './deploymentInformation/selectors';
import deployment from './deployment/selectors';
import repo from './repo/selectors';
import taskInformation from './taskInformation/selectors';
import task from './task/selectors';
import worker from './worker/selectors';
import { PersistState } from './types';
import { CrudState } from '../../common/utils/crudReducer';

const stateSelector = keySelector<State>();

export const getDeploymentState = stateSelector('deployment');
export const getDeploymentById = getDeploymentState.connect(deployment.byId);
export const getDeploymentGetOrNull = getDeploymentState.connect(deployment.getOrNull);

export const getDeploymentInformationState = stateSelector('deploymentInformation');
export const getDeploymentInformationById = getDeploymentInformationState.connect(deploymentInformation.byId);
export const getDeploymentInformationGetOrNull = getDeploymentInformationState.connect(deploymentInformation.getOrNull);

export const getRepoState = stateSelector('repo');
export const getRepoById = getRepoState.connect(repo.byId);
export const getRepoGetOrNull = getRepoState.connect(repo.getOrNull);

export const getTaskInformationState = stateSelector('taskInformation');
export const getTaskInformationById = getTaskInformationState.connect(taskInformation.byId);
export const getTaskInformationGetOrNull = getTaskInformationState.connect(taskInformation.getOrNull);

export const getTaskState = stateSelector('task');
export const getTaskById = getTaskState.connect(task.byId);
export const getTaskGetOrNull = getTaskState.connect(task.getOrNull);

export const getWorkerState = stateSelector('worker');
export const getWorkerById = getWorkerState.connect(worker.byId);
export const getWorkerGetOrNull = getWorkerState.connect(worker.getOrNull);

export function computePersistState(state: State): PersistState {
	function map<E, I extends string | number>(state: CrudState<E, I>): E[] {
		return state.byId.map(i => state.entities[i]!);
	}
	return {
		workers: map(state.worker),
		taskInformation: map(state.taskInformation),
		task: map(state.task),
		repo: map(state.repo),
		deploymentInformation: map(state.deploymentInformation),
		deployment: map(state.deployment),
	}
}