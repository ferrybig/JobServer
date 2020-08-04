import NodeWebSocket from "ws";
import action from "../../common/utils/ActionCreator";
import { Worker, Task, Repo, Deployment, DeploymentInformation, TaskInformation, PersistStateV1, PlatformTask } from '../../common/types';
import { actions as crudActions } from './crud';

export const connectionWorker = action('connectionWorker', (webSocket: NodeWebSocket, ip: string, workerToken: string, baseUrl: string) => ({ webSocket, ip, workerToken, baseUrl }));
export const connectionClient = action('connectionClient', (webSocket: NodeWebSocket, ip: string) => ({ webSocket, ip }));

export const workerAwaitsTask = action('workerAwaitsTask', (workerId: Worker['id']) => workerId);
export const workerDisconnected = action('workerDisconnected', (workerId: Worker['id']) => workerId);

export const triggerPlatformTask = action('triggerPlatformTask', (type: PlatformTask['type']) => type);

export const crudPersist = crudActions.persist;
export const crudDelete = crudActions.delete;
export const crudUpdate = crudActions.update;
export const crudConcat = crudActions.concat;
export const crudInit = crudActions.init;
