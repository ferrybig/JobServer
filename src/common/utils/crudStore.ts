import { Reducer } from "redux";

type Values<T> = T[keyof T];
type ValidKeyof = string | number | symbol

type Definition = Record<string, (entity: any) => ValidKeyof>;
type BaseActions<M extends ValidKeyof, P, I extends ValidKeyof> = {
	type: 'persist',
	module: M,
	payload: P
} | {
	type: 'delete',
	module: M,
	payload: I
} | {
	type: 'update',
	module: M,
	payload: {
		id: I,
		data: Partial<P>,
	},
} | {
	type: 'concat',
	module: M,
	payload: {
		id: I,
		field: Values<{ [K in keyof P]: P[K] extends string ? K : never }>,
		data: string,
	},
} | {
	type: 'init',
	payload: {
		[K in M]: P[] | undefined
	}
};
type ActionType = BaseActions<any, any, any>['type'];
type ActionTypes = Record<ActionType, string | null>;

type FilterOnType<B, T> = B extends T ? B : never;
type RemapType<A extends { type: any }, T extends Record<A['type'], string | null>> = A extends never ? never : Pick<A, Exclude<keyof A, 'type'>> & { type: T[A['type']] };
type AddTypeFromReturnType<F extends (...args: any) => {type: any}> = F extends (...args: any) => {type: infer T} ? F & { type: T } : never;
type RemoveNullType<F> = F extends (...args: any) => { type: null } ? never : F;


export interface CrudState<T, I extends ValidKeyof> {
	entities: Record<I, T | undefined>;
	byId: I[];
}

interface CrudStore<D extends Definition, A extends ActionTypes> {
	selectors: {
		get<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], ReturnType<D[M]>> }, module: M, key: ReturnType<D[M]> | null): Parameters<D[M]>[0];
		getOrNull<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], ReturnType<D[M]>> }, module: M, key: ReturnType<D[M]> | null): Parameters<D[M]>[0] | null;
		exists<M extends keyof D>(state: { [S in M]: CrudState<any, ReturnType<D[M]>> }, module: M, key: ReturnType<D[M]> | null): boolean;
		size<M extends keyof D>(state: { [S in M]: CrudState<any, any> }, module: M): number;
		allKeys<M extends keyof D>(state: { [S in M]: CrudState<any, ReturnType<D[M]>> }, module: M): ReturnType<D[M]>[];
		find<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], any> }, module: M, pattern: Partial<Parameters<D[M]>[0]> | ((input: Parameters<D[M]>[0]) => boolean)): Parameters<D[M]>[0] | null;
		findLatest<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], any> }, module: M, pattern: Partial<Parameters<D[M]>[0]> | ((input: Parameters<D[M]>[0]) => boolean)): Parameters<D[M]>[0] | null;
		filter<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], any> }, module: M, pattern: Partial<Parameters<D[M]>[0]> | ((input: Parameters<D[M]>[0]) => boolean)): Parameters<D[M]>[0][];
	},
	actions: {
		[K in Exclude<BaseActions<keyof D, any, any>['type'], 'init'>]: AddTypeFromReturnType<RemoveNullType<<M extends keyof D>(
			module: M,
			payload: FilterOnType<BaseActions<M, Parameters<D[M]>[0], ReturnType<D[M]>>, { type: K }>['payload']
		) => RemapType<FilterOnType<BaseActions<M, Parameters<D[M]>[0], ReturnType<D[M]>>, { type: K }>, A>>>
	} & {
		[K in 'init']: AddTypeFromReturnType<RemoveNullType<(initMap: {
			[M in keyof D]: Parameters<D[M]>[0][] | undefined
		}) => RemapType<FilterOnType<BaseActions<keyof D, Parameters<D[keyof D]>, ReturnType<D[keyof D]>>, { type: 'init' }>, A>>>
	},
	reducers: {
		[M in keyof D]: Reducer<CrudState<Parameters<D[M]>[0], ReturnType<D[M]>>, RemapType<BaseActions<M, Parameters<D[M]>[0], ReturnType<D[M]>>, A>>
	}
}

function checkMappedActionType<M extends ValidKeyof, P, I extends ValidKeyof, T extends ActionType, A extends ActionTypes>(actionTypes: A, action: RemapType<BaseActions<M, P, I>, A>, type: T, module: M): action is FilterOnType<BaseActions<M, P, I>, { type: T }> {
	if (action.type === actionTypes[type]) {
		if ('module' in action) {
			return (action as {module?: ValidKeyof}).module === module;
		}
		return true;
	}
	return false;
}

function makeFilter<T>(pattern: Partial<T> | ((input: T) => boolean)): (input: T) => boolean {
	return 'apply' in pattern ? pattern : (subject: T): boolean => {
		for (const key of Object.keys(pattern) as (keyof T)[]) {
			if (pattern[key] !== subject[key]) {
				return false;
			}
		}
		return true;
	};
}

const DEFAULT_STATE: CrudState<any, any> = {
	entities: {},
	byId: [],
};

const DEFAULT_SELECTORS = {
	get: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M, key: I | null): T => {
		const value = key === null ? undefined : state[module].entities[key];
		if (value === undefined) {
			throw new Error('Cannot find key ' + key + ' in ' + module);
		}
		return value as T;
	},
	getOrNull: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M, key: I | null): T | null => {
		const value = key === null ? undefined : state[module].entities[key];
		if (value === undefined) {
			return null;
		}
		return value as T;
	},
	exists: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M, key: I | null): boolean => {
		const value = key === null ? undefined : state[module].entities[key];
		return value !== undefined;
	},
	size: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M): number => {
		return state[module].byId.length;
	},
	allKeys: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M): I[] => {
		return state[module].byId;
	},
	find: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M, pattern: Partial<T> | ((input: T) => boolean)): T | null => {
		const filter = makeFilter(pattern);
		for(const id of state[module].byId) {
			if (filter(state[module].entities[id]!)) {
				return state[module].entities[id]!;
			}
		}
		return null;
	},
	findLatest: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M, pattern: Partial<T> | ((input: T) => boolean)): T | null => {
		const filter = makeFilter(pattern);
		for (let i = state[module].byId.length - 1; i >= 0; i--) {
			if (filter(state[module].entities[state[module].byId[i]]!)) {
				return state[module].entities[state[module].byId[i]]!;
			}
		}
		return null;
	},
	filter: <M extends ValidKeyof, T, I extends ValidKeyof>(state: { [S in M]: CrudState<T, I> }, module: M, pattern: Partial<T> | ((input: T) => boolean)): T[] => {
		const filter = makeFilter(pattern);
		const res: T[] = [];
		for(const id of state[module].byId) {
			if (filter(state[module].entities[id]!)) {
				res.push(state[module].entities[id]!);
			}
		}
		return res;
	},
};

function makeReducer<
	M extends ValidKeyof,
	P,
	I extends ValidKeyof,
	A extends ActionTypes
>(
	module: M,
	getKey: (entity: P) => I,
	actionTypes: A
): Reducer<CrudState<P, I>, RemapType<BaseActions<M, P, I>, A>> {
	return function reducer(state: CrudState<P, I> = DEFAULT_STATE, action): CrudState<P, I> {
		if(checkMappedActionType(actionTypes, action, 'persist', module)) {
			const key = getKey(action.payload);
			const existingValue = state.entities[key];
			if (existingValue === action.payload) {
				return state; // This exact entity is already stored
			}
			const newState = {
				...state,
				entities: { ...state.entities },
			};
			if (existingValue === undefined) {
				newState.byId = [...state.byId, key]; // This is an insertion, not an update
			}
			newState.entities[key] = action.payload;
			return newState;
		} else if (checkMappedActionType(actionTypes, action, 'delete', module)) {
			const key = action.payload as I;
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
		} else if (checkMappedActionType(actionTypes, action, 'init', module)) {
			if(!action.payload[module]) {
				return state;
			}
			const newState = {
				...state,
				entities: Object.fromEntries((action.payload[module] as P[]).map((e): [I, P] => [getKey(e), e])) as Record<I, P>,
				byId: (action.payload[module] as P[]).map(getKey),
			};
			if (Object.keys(newState.entities).length !== newState.byId.length) {
				throw new Error('Dublicate ID detected');
			}
			return newState;
		} else if (checkMappedActionType(actionTypes, action, 'update', module)) {
			const key = action.payload.id as I;
			const existingValue = state.entities[key];
			if (existingValue === undefined) {
				//console.warn('Throwing away');
				//return state;
				throw new Error('Entity identified by key ' + key + ' does not exist for update action: ' + JSON.stringify(action));
			}
			const newState = {
				...state,
				entities: { ...state.entities },
			};
			newState.entities[key] = {
				...existingValue,
				...(action.payload.data as Partial<P>),
			} as P;
			const newKey = getKey(newState.entities[key]!);
			if (newKey !== key) {
				const entity = newState.entities[key];
				delete newState.entities[key];
				newState.entities[newKey] = entity;
				// The key got modified!! Handle just in case
				const index = newState.byId.indexOf(key);
				if (index < 0) {
					throw new Error('Inconsistent state! key was found in entity map, but not in byId map');
				}
				newState.byId = [...state.byId];
				newState.byId[index] = newKey;
			}
			return newState;
		} else if (checkMappedActionType(actionTypes, action, 'concat', module)) {
			const key = action.payload.id as I;
			const existingValue = state.entities[key];
			if (existingValue === undefined) {
				//console.warn('Throwing away');
				//return state;
				throw new Error('Entity identified by key ' + key + ' does not exist for concat action: ' + JSON.stringify(action));
			}
			const newState = {
				...state,
				entities: { ...state.entities },
			};
			newState.entities[key] = {
				...existingValue,
				[action.payload.field]: (existingValue as P)[action.payload.field] + action.payload.data,
			} as P;
			const newKey = getKey(newState.entities[key]!);
			if (newKey !== key) {
				const entity = newState.entities[key];
				delete newState.entities[key];
				newState.entities[newKey] = entity;
				// The key got modified!! Handle just in case
				const index = newState.byId.indexOf(key);
				if (index < 0) {
					throw new Error('Inconsistent state! key was found in entity map, but not in byId map');
				}
				newState.byId = [...state.byId];
				newState.byId[index] = newKey;
			}
			return newState;
		} else {
			return state;
		}
	};
}

function makeAction<F, T>(actionCreator: F, type: T): F & { type: T } {
	(actionCreator as F & { type: T }).type = type;
	return (actionCreator as F & { type: T });
}

export const DEFAULT_ACTION_TYPES = {
	persist: 'persist',
	delete: 'delete',
	update: 'update',
	concat: 'concat',
	init: 'init',
} as const;

export default function makeCrudModules<D extends Definition, A extends ActionTypes>(definitions: D, actionTypes: A): CrudStore<D, A> {
	const actions: {
		[K in Exclude<BaseActions<keyof D, any, any>['type'], 'init'>]: <M extends keyof D>(
			module: M,
			payload: FilterOnType<BaseActions<M, ReturnType<D[M]>, Parameters<D[M]>[0]>, { type: K }>['payload']
		) => RemapType<FilterOnType<BaseActions<M, ReturnType<D[M]>, Parameters<D[M]>[0]>, { type: K }>, A> & { type: string | null }
	} & {
		[K in 'init']: (initMap: {
			[M in keyof D]: Parameters<D[M]>[0][] | undefined
		}) => RemapType<FilterOnType<BaseActions<keyof D, Parameters<D[keyof D]>, ReturnType<D[keyof D]>>, { type: 'init' }>, A> & { type: string | null }
	} = {
		persist: makeAction((module, payload) => ({
			module,
			payload,
			type: actionTypes.persist,
		}), actionTypes.persist),
		delete: makeAction((module, payload) => ({
			module,
			payload,
			type: actionTypes.delete,
		}), actionTypes.delete),
		update: makeAction((module, payload) => ({
			module,
			payload,
			type: actionTypes.update,
		}), actionTypes.update),
		concat: makeAction((module, payload) => ({
			module,
			payload,
			type: actionTypes.concat,
		}), actionTypes.concat),
		init: makeAction((payload) => ({
			payload,
			type: actionTypes.init,
		}), actionTypes.init),
	};

	return {
		selectors: DEFAULT_SELECTORS,
		actions: actions as { [K in keyof typeof actions]: AddTypeFromReturnType<RemoveNullType<(typeof actions)[K]>>},
		reducers: Object.fromEntries(Object.entries(definitions).map(([module, getKey]): [keyof D, Reducer<any, any>] => [module, makeReducer(module, getKey, actionTypes)])) as Record<keyof D, Reducer<any, any>>,
	};
}

export function keyByField<F extends ValidKeyof>(field: F): <P extends { [K in F]: ValidKeyof }>() => (entity: P) => P[F] {
	return () => (entity) => entity[field];
}
export const keyByIdField = keyByField('id');
