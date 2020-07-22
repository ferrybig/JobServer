import NodeWebSocket from "ws";
import action from "../../common/utils/ActionCreator";
import {Worker, Task, Repo, Deployment, DeploymentInformation, TaskInformation, PersistState } from './types'

export const connectionWorker = action('connectionWorker', (webSocket: NodeWebSocket, ip: string, workerToken: string, ) => ({ webSocket, ip, workerToken }));
export const connectionClient = action('connectionClient', (webSocket: NodeWebSocket, ip: string) => ({ webSocket, ip }));
export const workerNeedsTask = action('workerNeedsTask', (workerId: string) => ({ workerId }));
export const taskAppendLog = action('taskAppendLog', (taskId: Task['id'], logPart: string) => ({ taskId, logPart }));
export const taskUpdateStatus = action('taskUpdateStatus', (taskId: Task['id'], status: Task['status']) => ({ taskId, status }));
export const taskInformationPersist = action('taskInformationPersist', (task: TaskInformation) => task);
export const taskInformationDelete = action('taskInformationDelete', (id: string) => id);
export const taskPersist = action('taskPersist', (task: Task) => task);
export const taskDelete = action('taskDelete', (id: string) => id);
export const workerPersist = action('workerPersist', (worker: Worker) => worker);
export const workerDelete = action('workerDelete', (id: string) => id);
export const repoPersist = action('repoPersist', (repo: Repo) => repo);
export const repoDelete = action('repoDelete', (id: string) => id);
export const deploymentPersist = action('deploymentPersist', (deployment: Deployment) => deployment);
export const deploymentDelete = action('deploymentDelete', (id: string) => id);
export const deploymentInformationPersist = action('deploymentInformationPersist', (deployment: DeploymentInformation) => deployment);
export const deploymentInformationDelete = action('deploymentInformationDelete', (id: string) => id);
export const loadState = action('loadState', (state: PersistState) => state);
export const workerAwaitsTask = action('workerAwaitsTask', (workerId: Worker['id']) => workerId);
export const workerAllocatedTask = action('workerAwaitsTask', (workerId: Worker['id']) => workerId);
export const workerDisconnected = action('workerDisconnected', (workerId: Worker['id']) => workerId);
