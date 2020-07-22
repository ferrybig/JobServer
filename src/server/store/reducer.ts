import {combineReducers} from "redux";
import deployment from './deployment';
import deploymentInformation from './deploymentInformation';
import repo from './repo';
import task from './task';
import taskInformation from './taskInformation';
import worker from './worker';

const reducer = combineReducers({
	deployment,
	deploymentInformation,
	repo,
	task,
	taskInformation,
	worker,
});

export type State = ReturnType<typeof reducer>;
export default reducer;
