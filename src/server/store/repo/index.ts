import buildReducer from "../../../common/utils/buildReducer";
import { initialState } from "./state";
import * as mainActions from '../actions';
import crudReducer from "../../../common/utils/crudReducer";
import { Repo} from "../types";

export default buildReducer(initialState, mainActions, {
	...crudReducer({
		persist: mainActions.repoPersist,
		destroy: mainActions.repoDelete,
		unpersist: [mainActions.loadState, 'repo'] as const,
	}, (repo: Repo) => repo.id)
});
