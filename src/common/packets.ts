import { BuildTask } from "./types";

export interface TaskRequest {
	type: 'taskRequest',
}
export interface PingPacket {
	type: 'ping',
}
export interface PongPacket {
	type: 'pong',
}
export interface TaskReceived {
	type: 'taskReceived',
	payload: {
		task: BuildTask,
	}
}
export interface TaskProgressAppend {
	type: 'taskProgressAppend',
	payload: {
		taskId: BuildTask['id'],
		logPart: string,
	}
}
export interface TaskFinished {
	type: 'taskFinished',
	payload: {
		taskId: BuildTask['id'],
		log: string,
		fileSize: number,
	}
}
export interface TaskError {
	type: 'taskError',
	payload: {
		taskId: BuildTask['id'],
		log: string,
	}
}
export interface TaskStartUpload {
	type: 'taskStartUpload',
	payload: {
		taskId: BuildTask['id'],
		offset: number,
		url: string,
	}
}
export interface TaskResultUploaded {
	type: 'taskResultUploaded',
	payload: {
		taskId: BuildTask['id'],
	}
}
export type ServerToWorkerPacket = TaskReceived | TaskStartUpload | PongPacket | TaskResultUploaded;
export type WorkerToServerPacket = TaskRequest | PingPacket | TaskProgressAppend | TaskFinished | TaskError;
