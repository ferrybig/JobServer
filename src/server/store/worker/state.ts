import {CrudState} from "../../../common/utils/crudReducer";
import {Worker} from '../types'

export default interface WorkerState extends CrudState<Worker, string> {
}

export const initialState: Readonly<WorkerState> = {
	entities: {},
	byId: [],
}
