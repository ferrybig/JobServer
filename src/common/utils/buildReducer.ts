import {ActionCreator} from "./ActionCreator";
import {ActionMapper} from "./ActionMapper";
import {AnyAction} from "redux";

type AllowedActions = ActionCreator<any, any> | ActionMapper<any, any>;

type FilterExtends<O, E> = O extends E ? O : never;

type ExtractAction<A extends AllowedActions> =
	A extends ActionCreator<any, infer P> ? P :
	A extends ActionMapper<any, infer P> ? P :
	never;

export default function buildReducer<
	S,
	A extends Record<string, AllowedActions>
>(
	initialState: S,
	validActions: A,
	switchMap: {
		[K in A[keyof A]['type']]?: (state: S, action: ExtractAction<FilterExtends<A[keyof A], { type: K }>>) => S
	}
): (state: S | undefined, action: AnyAction) => S {
	const mappedSwitchMap: Record<string, (state: S, action: AnyAction) => AnyAction> = {};
	const actionSwitchMap: Record<string, (state: S, action: AnyAction) => S> = {};
	const finalReducer = (state: S = initialState, action: AnyAction): S => {
		if (actionSwitchMap[action.type]) {
			if (mappedSwitchMap[action.type]) {
				action = mappedSwitchMap[action.type](state, action);
			}
			return actionSwitchMap[action.type](state, action);
		}
		return state;
	};
	const validActionsMap: Record<string, AllowedActions> = Object.fromEntries(Object.values(validActions).map(e => [e.type, e]));
	for (const type in switchMap) {
		const typeDefinition = validActionsMap[type];
		if ('typeMapper' in typeDefinition) {
			for (const type in typeDefinition.typeMapper) {
				mappedSwitchMap[type] = typeDefinition.typeMapper[type];
			}
		}
		const callback = switchMap[type as keyof typeof switchMap];
		actionSwitchMap[type] = callback as (state: S, action: AnyAction) => S;
	}
	return finalReducer;
}