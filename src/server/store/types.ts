import {Command} from "../../common/types";

export interface Worker {
	id: string;
	currentTask: Task['id'] | null;
	// lastConnect: number,
	// name: string
}

export interface Task {
	id: string
	outputFile: string | null,
	workerId: string | null;
	status: 'init' | 'approved' | 'running' | 'uploading' | 'success' | 'error' | 'timeout' | 'cancelled',
	log: string,
	taskInformationId: TaskInformation['id'],
	deploymentId: Deployment['id'],
	startTime: number;
	buildTime: number;
	endTime: number;
}
export interface TaskInformation {
	id: string
	name: string,
	buildScript: Command[],
	deploymentInformationId: DeploymentInformation['id'];
	sequenceId: number;
	deploymentDir: string | null;
	deploymentType: /*'static' |*/ 'static-extract' /*| 'docker'*/
	deploymentInstructions: string;
	deleted: boolean;
	sitePath: string,
	siteId: Site['id'] | null,
}

export interface Repo {
	id: string
	url: string,
	secret: string,
	outputDir: string,
}
export interface Deployment {
	id: string;
	commit: string,
	branch: string,
	outputDir: string | null,
	status: 'pending' | 'success' | 'error' | 'cancelled';
	deploymentInformationId: DeploymentInformation['id'];
	timestamp: number;
	sequenceId: number;
	deployed: boolean;
}
export interface DeploymentInformation {
	id: string
	name: string,
	pattern: string,
	outputDir: string | null,
	repoId: Repo['id'],
	deleted: boolean;
}
export interface Site {
	id: string
	name: string,
	configBlob: string,
	aliasses: string[],
	type: 'no-ssl' | 'ssl' | 'any-ssl',
	default: boolean;
}
// TODO: Deployment agent log file entity
export interface PersistStateV1 {
	version: 'v1',
	workers: Worker[],
	taskInformation: TaskInformation[],
	task: Task[],
	repo: Repo[],
	deploymentInformation: DeploymentInformation[],
	deployment: Deployment[],
	pendingFiles: PendingUploadedFile[],
	site: Site[],
}
export type PersistState = PersistStateV1;
export interface PendingUploadedFile {
	token: string,
	outputFile: string,
	fileSize: number,
}
