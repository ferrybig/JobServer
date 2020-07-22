import {CrudState} from "../../../common/utils/crudReducer";
import {Repo} from '../types'

export default interface RepoState extends CrudState<Repo, string> {
}

export const initialState: Readonly<RepoState> = {
	entities: {},
	byId: [],
}
