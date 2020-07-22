import buildReducer from "../../../common/utils/buildReducer";
import { initialState } from "./state";
import * as mainActions from '../actions';
import crudReducer from "../../../common/utils/crudReducer";
import { Task} from "../types";
import doMutation from "../../../common/utils/doMutation";

export default buildReducer(initialState, mainActions, {
	...crudReducer({
		persist: mainActions.taskPersist,
		destroy: mainActions.taskDelete,
		unpersist: [mainActions.loadState, 'task'] as const,
	}, (task: Task) => task.id),
	taskAppendLog(state, {payload}) {
		return doMutation(state)('entities')(payload.taskId).update('log', (oldLog) => oldLog + payload.logPart);
	},
	taskUpdateStatus(state, {payload}) {
		return doMutation(state)('entities')(payload.status).set('status', payload.status);
	}
});
