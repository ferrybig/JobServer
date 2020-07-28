import makeCrudModules, {DEFAULT_ACTION_TYPES, keyById} from "../../common/utils/crudStore";
import {Worker, Task, TaskInformation, Repo, Deployment, DeploymentInformation, PendingUploadedFile, Site} from './types';

export const {
	selectors,
	actions,
	reducers,
} = makeCrudModules({
	workers: keyById<Worker>(),
	task: keyById<Task>(),
	taskInformation: keyById<TaskInformation>(),
	repo: keyById<Repo>(),
	deployment: keyById<Deployment>(),
	deploymentInformation: keyById<DeploymentInformation>(),
	pendingFiles: (file: PendingUploadedFile) => file.token,
	site: keyById<Site>(),
}, DEFAULT_ACTION_TYPES);
