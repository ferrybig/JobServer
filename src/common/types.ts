export interface BuildTask {
	id: string
	buildScriptType: 'docker',
	buildScript: string[],
	repo: RepoDescription,
}
export interface RepoDescription {
	url: string,
	commit: string,
	branch: string | null,
}

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
	buildScript: string[],
	buildScriptType: 'docker',
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
	ssl: 'yes' | 'no',
	noSsl: 'yes' | 'no' | 'redirect',
	default: boolean;
	includesBefore: NginxConfig['id'] | null,
	includesAfter: NginxConfig['id'] | null,
}
export interface NginxConfig {
	id: string
	name: string,
	configBlob: string,
	includesBefore: NginxConfig['id'] | null,
	includesAfter: NginxConfig['id'] | null,
}
export interface PlatformTask {
	id: string
	type: 'deployment',
	status: 'pending' | 'running' | 'success' | 'error';
	log: string;
	warnings: string;
	startTime: number;
	endTime: number;
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
	pendingFile: PendingUploadedFile[],
	site: Site[],
	nginxConfig: NginxConfig[],
	platformTask: PlatformTask[],
}
export type PersistState = PersistStateV1;
export interface PendingUploadedFile {
	token: string,
	outputFile: string,
	fileSize: number,
}
