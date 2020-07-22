import {AnyAction} from "redux";

export interface ActionCreator<D extends any[], A extends { type: string, payload: any }> {
	toString(): string;
	(...args: D): A;
	type: A['type'];
	asFilter(filter: (action: A) => boolean): (action: AnyAction) => boolean;
}

export default function action<D extends any[], P, T extends string>(
	type: T,
	func: (...args: D) => P,
): ActionCreator<D, { type: T, payload: P }> {
	function actionCreator(...args: D): { type: T, payload: P } {
		return {
			payload: func(...args),
			type,
		};
	}
	actionCreator.type = type;
	const stringified = func.toString();
	const splitPoint = Math.min(...[stringified.indexOf('=>'), stringified.indexOf('{')].filter(e => e >= 0));
	const nameAndArguments = stringified.substring(0, splitPoint);
	const paraphesesOpen = nameAndArguments.indexOf('(') >= 0 ? nameAndArguments.indexOf('(') + 1 : 0;
	const paraphesesClose = nameAndArguments.indexOf(')') >= 0 ? nameAndArguments.indexOf(')') : nameAndArguments.length;
	actionCreator.toString = () => `${type}(${nameAndArguments.substring(paraphesesOpen, paraphesesClose).trim()})`;
	actionCreator.asFilter = (filter?: (action: { type: T, payload: P }) => boolean): (action: AnyAction) => boolean => (action) => {
		if (action.type !== type) return false;
		return filter ? filter(action as { type: T, payload: P }) : true;
	}
	return actionCreator;
}
