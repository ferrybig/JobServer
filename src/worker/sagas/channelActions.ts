import action from '../../common/store/ActionCreator';
import { BuildTask } from '../../common/types';

export const taskRequest = action('taskRequest', () => null);
export const taskReceived = action('taskReceived', (task: BuildTask) => ({ task }));
export const taskProgressAppend = action('taskProgressAppend', (log: string) => ({ log }));
export const taskFinished = action('taskFinished', (resultFile: string, log: string) =>  ({ resultFile, log }));
export const taskErrored = action('taskErrored', (log: string) =>  ({ log }));
export const taskResultUploaded = action('taskResultUploaded', (resultFile: string | null) =>  ({ resultFile }));
export const socketConnected = action('socketConnected', () => null);
export const socketDisconnected = action('socketDisconnected', () => null);

export const INCOMING = [
	taskReceived,
	taskResultUploaded,
	socketConnected,
	socketDisconnected,
];
export type INCOMING_TYPE = ReturnType<(typeof INCOMING)[number]>
export const OUTGOING = [
	taskRequest,
	taskProgressAppend,
	taskFinished,
	taskErrored,
];
export type OUTGOING_TYPE = ReturnType<(typeof OUTGOING)[number]>
