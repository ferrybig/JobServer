import {CrudState} from "../../../common/utils/crudReducer";
import {Deployment} from '../types'

export default interface DeploymentState extends CrudState<Deployment, string> {
}

export const initialState: Readonly<DeploymentState> = {
	entities: {},
	byId: [],
}
