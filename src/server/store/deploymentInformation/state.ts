import {CrudState} from "../../../common/utils/crudReducer";
import {DeploymentInformation} from '../types'

export default interface DeploymentState extends CrudState<DeploymentInformation, string> {
}

export const initialState: Readonly<DeploymentState> = {
	entities: {},
	byId: [],
}
