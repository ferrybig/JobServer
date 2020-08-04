import makeCrudModules, { DEFAULT_ACTION_TYPES, keyByIdField } from '../../common/store/crudStore';
import { Worker, Task, TaskInformation, Repo, Deployment, DeploymentInformation, PendingUploadedFile, Site, NginxConfig, PlatformTask } from '../../common/types';

export const {
	selectors,
	actions,
	reducers,
} = makeCrudModules({
	workers: keyByIdField<Worker>(),
	task: keyByIdField<Task>(),
	taskInformation: keyByIdField<TaskInformation>(),
	repo: keyByIdField<Repo>(),
	deployment: keyByIdField<Deployment>(),
	deploymentInformation: keyByIdField<DeploymentInformation>(),
	pendingFile: (file: PendingUploadedFile) => file.token,
	site: keyByIdField<Site>(),
	nginxConfig: keyByIdField<NginxConfig>(),
	platformTask: keyByIdField<PlatformTask>(),
}, DEFAULT_ACTION_TYPES);
