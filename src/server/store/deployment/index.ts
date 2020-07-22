import buildReducer from "../../../common/utils/buildReducer";
import { initialState } from "./state";
import * as mainActions from '../actions';
import crudReducer from "../../../common/utils/crudReducer";
import { Deployment} from "../types";

export default buildReducer(initialState, mainActions, {
	...crudReducer({
		persist: mainActions.deploymentPersist,
		destroy: mainActions.deploymentDelete,
		unpersist: [mainActions.loadState, 'deployment'] as const,
	}, (deployment: Deployment) => deployment.id)
});
