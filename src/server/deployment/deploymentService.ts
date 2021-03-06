import { TaskInformation, Task, Site, Deployment, DeploymentInformation } from '../../common/types';

type RemoveNull<T> = T extends null ? never : T;
type MarkFieldAsNonNull<T, F extends keyof T> = {
	[K in keyof T]: K extends F ? RemoveNull<T[K]> : T[K];
}

/**
 * Sequence of operations:
 * newService.preStart()
 * newService.generateConfigBlob();
 * configService.checkConfig();
 * oldService.stop()
 * newService.start()
 * oldService.afterStop()
 */
export interface RawDeploymentData {
	 taskInformation: TaskInformation;
	 task: Task;
	 deployment: Deployment;
	 deploymentInformation: DeploymentInformation;

}
export interface DeploymentData {
	taskInformation: MarkFieldAsNonNull<TaskInformation, 'deploymentDir'>;
	task: MarkFieldAsNonNull<Task, 'outputFile'>;
	deployment: Deployment;
	deploymentInformation: DeploymentInformation;
}
export interface DeploymentServiceOptions {
	logger?: (log: string) => void;
}

export interface DeploymentService {
	/**
	 * Called at the first step of deploying a service, the old service is still running at the moment
	 */
	preStart(data: DeploymentData, options?: DeploymentServiceOptions): Promise<void>;
	/**
	 * Actually starts the new service, the old service is stopped
	 */
	start(data: DeploymentData, options?: DeploymentServiceOptions): Promise<void>;
	/**
	 * Stops the service, the new service is prepared, but not started
	 */
	stop(data: DeploymentData, options?: DeploymentServiceOptions): Promise<void>;
	/**
	 * Used to clean up files from the deployment
	 */
	afterStop(data: DeploymentData, options?: DeploymentServiceOptions): Promise<void>;
	/**
	 * Check the status of pending deployment files, called as part of the fsck routines
	 */
	checkStatus(data: DeploymentData, options?: DeploymentServiceOptions): Promise<'missing' | 'prepared' | 'running'>;
	/**
	 * Generates a config blob for NGINX
	 */
	generateConfigBlob(data: DeploymentData, site: Site, options?: DeploymentServiceOptions): Promise<string> | string;
}

export type DeploymentServiceForTask = {
	[K in keyof DeploymentService]: DeploymentService[K] extends (data: DeploymentData, ...args: infer A) => infer R ? (...args: A) => R : DeploymentService[K];
} & { data: DeploymentData }

export function rawDeploymentDataIsDeploymentData(a: RawDeploymentData): a is DeploymentData {
	return a.taskInformation.deploymentDir !== null && a.task.outputFile !== null;
}
export interface DeploymentChangeSet {
	existingSituation: DeploymentData[];
	toDelete: DeploymentData[];
	toCreate: DeploymentData[];
	newSituation: DeploymentData[];
}
