import makeCrudModules, { DEFAULT_ACTION_TYPES, keyByIdField } from '../../common/store/crudStore';
import { Worker, Task, TaskInformation, Repo, Deployment, DeploymentInformation, PendingUploadedFile, Site, NginxConfig, PlatformTask, AuthorizedUser } from '../../common/types';

export const {
	selectors,
	actions,
	reducers,
	keys: moduleKeys,
	getIdFromEntity,
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
	authorizedUser: keyByIdField<AuthorizedUser>(),
}, DEFAULT_ACTION_TYPES);

export type ModuleKeys = (typeof moduleKeys)[number];
