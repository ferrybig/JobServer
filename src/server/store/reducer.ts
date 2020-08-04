import { combineReducers } from "redux";
import { reducers as crudReducers } from './crud';

const reducer = combineReducers({
	deployment: crudReducers.deployment,
	deploymentInformation: crudReducers.deploymentInformation,
	repo: crudReducers.repo,
	task: crudReducers.task,
	taskInformation: crudReducers.taskInformation,
	workers: crudReducers.workers,
	pendingFile: crudReducers.pendingFile,
	site: crudReducers.site,
	nginxConfig: crudReducers.nginxConfig,
	platformTask: crudReducers.platformTask,
});

export type State = ReturnType<typeof reducer>;
export default reducer;
