import { State } from './reducer';
import { PersistStateV1, Task, Deployment } from './types';
import {selectors as crudSelectors} from './crud'
import {CrudState} from '../../common/utils/crudStore';
import {BuildTask} from '../../common/types';
import {DeploymentData, RawDeploymentData, rawDeploymentDataIsDeploymentData} from '../deployment/deploymentService';
import sortByKey from '../../common/utils/sortByKey';

export const get = crudSelectors.get;
export const getOrNull = crudSelectors.getOrNull;
export const exists = crudSelectors.exists;
export const allKeys = crudSelectors.allKeys;
export const size = crudSelectors.size;
export const find = crudSelectors.find;
export const findLatest = crudSelectors.findLatest;
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
		nginxConfig: map(state.nginxConfig),
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
	// Newer tasks hould be more important, might want to add a config flag for this
	const selector = findLatest;
	return selector(state, 'task', {
		status: 'approved',
		workerId: null,
	});
}

export function taskToDeploymentData(state: Pick<State, 'taskInformation' | 'deployment' | 'deploymentInformation'>, task: Task): DeploymentData | null {
	const taskInformation = get(state, 'taskInformation', task.taskInformationId);
	const deployment = get(state, 'deployment', task.deploymentId);
	const raw: RawDeploymentData = {
		taskInformation,
		task,
		deployment,
		deploymentInformation: get(state, 'deploymentInformation', deployment.deploymentInformationId)
	};
	return rawDeploymentDataIsDeploymentData(raw) ? raw : null;
}

function notNull<T>(input: T): input is NonNullable<T> {
	return input !== undefined && input !== null;
}

function deploymentToDeploymentData(state: Pick<State, 'task' | 'taskInformation' | 'deployment' | 'deploymentInformation'>, deployment: Deployment) {
	return filter(state, 'task', {deploymentId: deployment.id, status: 'success'}).map(t => taskToDeploymentData(state, t)).filter(notNull);
}

export function computeDeployment(state: Pick<State, 'taskInformation' | 'task' | 'deployment' | 'deploymentInformation'>): {
	existingSituation: DeploymentData[],
	toDelete: DeploymentData[],
	toCreate: DeploymentData[],
	newSituation: DeploymentData[],
} {
	const existingSituation: DeploymentData[] = filter(state, 'deployment', {
		deployed: true,
	}).flatMap(d => filter(state, 'task', {deploymentId: d.id})).map(t => taskToDeploymentData(state, t)).filter(notNull);
	const newSituation: DeploymentData[] = filter(state, 'deploymentInformation', {
		deleted: false,
	}).map((e): Deployment | null => {
		return filter(state, 'deployment', {deploymentInformationId: e.id, status: 'success'}).sort(sortByKey('sequenceId', false))[0] || null;
	}).flatMap(d => {
		return !d ? [] : filter(state, 'task', {deploymentId: d.id});
	}).map(t => taskToDeploymentData(state, t)).filter(notNull);
	const existingSituationByKey = Object.fromEntries(existingSituation.map((e): [DeploymentData['task']['id'], true] => [e.task.id, true]));
	const newSituationByKey = Object.fromEntries(newSituation.map((e): [DeploymentData['task']['id'], true] => [e.task.id, true]));
	return {
		existingSituation,
		newSituation,
		toCreate: newSituation.filter(e => !existingSituationByKey[e.task.id]),
		toDelete: existingSituation.filter(e => !newSituationByKey[e.task.id]),
	}
}