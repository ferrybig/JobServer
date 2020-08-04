import { Middleware } from "redux";

export default function storeLogger() {
	const middleWare: Middleware = (api) => {
		return (next)  => {
			return (action) => {
				const state = next(action);
				console.log('ACTION: ' + JSON.stringify(state));
				//console.dir(api.getState());
				return state;
			};
		};
	};
	return middleWare;
}
