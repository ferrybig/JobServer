import buildReducer from "../../../common/utils/buildReducer";
import { initialState } from "./state";
import * as mainActions from '../actions';
import crudReducer from "../../../common/utils/crudReducer";
import { Worker} from "../types";

const t = crudReducer({
	persist: mainActions.workerPersist,
	destroy: mainActions.workerDelete,
	unpersist: [mainActions.loadState, 'workers'] as const,
}, (worker: Worker) => worker.id);

export default buildReducer(initialState, mainActions, t);
