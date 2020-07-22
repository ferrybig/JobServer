import {CrudState} from "../../../common/utils/crudReducer";
import {TaskInformation} from '../types'

export default interface TaskState extends CrudState<TaskInformation, string> {
}

export const initialState: Readonly<TaskState> = {
	entities: {},
	byId: [],
}
