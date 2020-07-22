import {Command, RepoDescription} from "../../common/types";

export interface Worker {
	id: string;
	currentTask: Task['id'] | null;
	// lastConnect: number,
	// name: string
}

export interface Task {
	id: string
	buildScript: Command[],
	commit: string,
	outputFile: string | null,
	workerId: string | null;
	status: 'init' | 'approved' | 'running' | 'uploading' | 'success' | 'error' | 'timeout' | 'cancelled',
	log: string,
	taskInformationId: TaskInformation['id'],
	deploymentId: Deployment['id'],
}
export interface TaskInformation {
	id: string
	buildScript: Command[],
	deploymentInformationId: DeploymentInformation['id']
}

export interface Repo {
	id: string
	url: string,
}
export interface Deployment {
	id: string
	outputDir: string | null,
	status: 'pending' | 'success' | 'error' | 'cancelled'
	deploymentInformationId: DeploymentInformation['id']
}
export interface DeploymentInformation {
	id: string
	branch: string,
	outputDir: string | null,
	repoId: Repo['id'],
}
export interface PersistState {
	workers: Worker[],
	taskInformation: TaskInformation[],
	task: Task[],
	repo: Repo[],
	deploymentInformation: DeploymentInformation[],
	deployment: Deployment[],
}