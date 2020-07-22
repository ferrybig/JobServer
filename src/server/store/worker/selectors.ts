import State from "./state";

export default {
	byId(state: State) {
		return state.byId;
	},
	getOrNull(state: State, id: string) {
		return state.entities[id] || null;
	},
}
