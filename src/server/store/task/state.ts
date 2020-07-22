import {CrudState} from "../../../common/utils/crudReducer";
import {Task} from '../types'

export default interface TaskState extends CrudState<Task, string> {
}

export const initialState: Readonly<TaskState> = {
	entities: {},
	byId: [],
}
