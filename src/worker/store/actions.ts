import action from "../../common/utils/ActionCreator";
import {BuildTask} from "../../common/types";

export const taskRequest = action('taskRequest', () => null);
export const taskReceived = action('taskReceived', (task: BuildTask) => ({task}));
export const taskProgressAppend = action('taskProgressAppend', (task: BuildTask, log: string) => ({task, log}));
export const taskFinished = action('taskFinished', (task: BuildTask, resultFile: string, log: string) =>  ({task, resultFile, log}));
export const taskErrored = action('taskErrored', (task: BuildTask, log: string) =>  ({task, log}));
export const taskResultUploaded = action('taskResultUploaded', (task: BuildTask, resultFile: string | null) =>  ({task, resultFile}));
export const socketConnected = action('socketConnected', () => null);
export const socketDisconnected = action('socketDisconnected', () => null);
