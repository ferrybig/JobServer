import buildReducer from "../../../common/utils/buildReducer";
import { initialState } from "./state";
import * as mainActions from '../actions';
import crudReducer from "../../../common/utils/crudReducer";
import { DeploymentInformation } from "../types";

export default buildReducer(initialState, mainActions, {
	...crudReducer({
		persist: mainActions.deploymentInformationPersist,
		destroy: mainActions.deploymentInformationDelete,
		unpersist: [mainActions.loadState, 'deploymentInformation'] as const,
	}, (deployment: DeploymentInformation) => deployment.id)
});
