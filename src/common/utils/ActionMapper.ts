import {ActionCreator} from "./ActionCreator";
import {AnyAction} from "redux";

export interface ActionMapper<
	S,
	A extends { type: string, payload: any }
> {
	type: A['type'];
	typeMapper: Record<string, (state: S, originalAction: AnyAction) => A>;
}

type FilterExtends<O, E> = O extends E ? O : never;

type ExtractAction<A extends ActionCreator<any, any>> =
	A extends ActionCreator<any, infer P> ? P :
	never;

export default function mappedAction<
	S,
	T extends string,
	A extends Record<string, ActionCreator<any, any>>,
	M extends {
		[K in A[keyof A]['type']]: (state: S, action: ExtractAction<FilterExtends<A[keyof A], { type: K }>>) => { type: T, payload: any }
	}
>(
	type: T,
	validActions: A,
	typeMapper: M
): ActionMapper<S, ReturnType<M[keyof M]>> {
	return {
		type,
		typeMapper: typeMapper as any,
	};
}