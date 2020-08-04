import Values from '../utils/Values';

type UnionToIntersection<T> =
  (T extends any ? (x: T) => any : never) extends
  (x: infer R) => any ? R : never
type FilterUndefined<T> = T extends undefined ? never : T

interface ReducerType<P> {
	(...arg: any[]): { type: string, payload: P }
	type: string
}
type DeepReducerType = readonly [{
	(...arg: any[]): { type: string, payload: any } // TODO destroy this any, it is causing to many mistakes
	type: string
}, string]

interface ActionMap<T, I> {
	persist?: ReducerType<T>,
	destroy?: ReducerType<I>,
	unpersist?: DeepReducerType,
}

export interface CrudState<T, I extends string | number> {
	entities: Record<I, T | undefined>;
	byId: I[];
}

type MapActionMapDefinition<
	T,
	I extends string | number,
	D extends ReducerType<any> | DeepReducerType | undefined
> = D extends (...arg: any[]) => { type: infer R, payload: infer P } ? {
	[K in (R extends string ? R : never)]: <S extends CrudState<T, I>>(state: S, action: { payload: P }) => S & CrudState<T, I>
} : D extends readonly [(...arg: any[]) => { type: infer R }, infer K1] ? {
	[K in (R extends string ? R : never)]: <S extends CrudState<T, I>>(state: S, action: { payload: { [K2 in (K1 extends string ? K1 : never)]: T[] | undefined } }) => S & CrudState<T, I>
} : never;

type MapActionMap<M extends ActionMap<any, any>, T, I extends string | number> = UnionToIntersection<FilterUndefined<Values<{
	[K in keyof ActionMap<any, any>]: MapActionMapDefinition<T, I, M[K]>
}>>>;

export default function crudReducer<T, I extends string | number, M extends ActionMap<T, I>>(actions: M, getKey: (entity: T) => I): MapActionMap<M, T, I> {
	const map: any = {};
	if (actions.persist) {
		map[actions.persist.type] = (state: CrudState<T, I>, { payload }: { payload: T }): CrudState<T, I> => {
			const key = getKey(payload);
			const existingValue = state.entities[key];
			if (existingValue === payload) {
				return state;
			}
			const newState = {
				...state,
				entities: { ...state.entities },
			};
			if (existingValue !== undefined) {
				newState.byId = [...state.byId, key];
			}
			newState.entities[key] = payload;
			return newState;
		};
	}
	if (actions.destroy) {
		map[actions.destroy.type] = <S extends CrudState<T, I>>(state: S, { payload: key }: { payload: I }): S => {
			const existingValue = state.entities[key];
			if (existingValue === undefined) {
				return state;
			}
			const newState = {
				...state,
				entities: { ...state.entities },
				byId: [...state.byId],
			};
			const index = newState.byId.indexOf(key);
			if (index < 0) {
				throw new Error('Inconsistent state! key was found in entity map, but not in byId map');
			}
			newState.byId.splice(index, 1);
			delete newState.entities[key];
			return newState;
		};
	}
	if (actions.unpersist) {
		const unpersistKey = actions.unpersist[1];
		map[actions.unpersist[0].type] = <S extends CrudState<T, I>>(state: S, { payload }: { payload: Record<string, T[]>}): S => payload[unpersistKey] ? {
			...state,
			entities: Object.fromEntries(payload[unpersistKey].map((e): [I, T] => [getKey(e), e])),
			byId: payload[unpersistKey].map(getKey),
		} : state;
	}
	return map;
}
