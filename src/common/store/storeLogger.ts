import {Middleware, MiddlewareAPI, Dispatch, AnyAction} from "redux";
import { createLogger } from 'redux-logger'

export default function storeLogger() {
//	return createLogger({
//		
//	});
	const middleWare: Middleware = (api) => {
		return (next)  => {
			return (action) => {
				const state = next(action);
				console.log('ACTION: ' + JSON.stringify(state));
				//console.dir(api.getState());
				return state;
			}
		}
	}
	return middleWare;
}