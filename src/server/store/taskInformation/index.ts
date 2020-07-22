import buildReducer from "../../../common/utils/buildReducer";
import { initialState } from "./state";
import * as mainActions from '../actions';
import crudReducer from "../../../common/utils/crudReducer";
import { TaskInformation} from "../types";
import doMutation from "../../../common/utils/doMutation";

export default buildReducer(initialState, mainActions, {
	...crudReducer({
		persist: mainActions.taskInformationPersist,
		destroy: mainActions.taskInformationDelete,
		unpersist: [mainActions.loadState, 'taskInformation'] as const,
	}, (task: TaskInformation) => task.id),
});
