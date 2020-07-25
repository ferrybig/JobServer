import {Reducer} from "redux";

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
type RemapType<A extends {type: any}, T extends Record<A['type'], string | null>> = Pick<A, Exclude<keyof A, 'type'>> & { type: T[A['type']] };
type AddTypeFromReturnType<F extends (...args: any) => {type: any}> = F extends (...args: any) => {type: infer T} ? F & { type: T } : never;
type RemoveNullType<F> = F extends (...args: any) => { type: null } ? never : F;


export interface CrudState<T, I extends ValidKeyof> {
	entities: Record<I, T | undefined>;
	byId: I[];
}

interface CrudStore<D extends Definition, A extends ActionTypes> {
	selectors: {
		get<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], ReturnType<D[M]>> }, module: M, key: ReturnType<D[M]> | null): Parameters<D[M]>[0];
		getOrNull<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], ReturnType<D[M]>> }, module: M, key: ReturnType<D[M]> | null): Parameters<D[M]>[0];
		exists<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], ReturnType<D[M]>> }, module: M, key: ReturnType<D[M]> | null): boolean;
		allKeys<M extends keyof D>(state: { [S in M]: CrudState<Parameters<D[M]>[0], ReturnType<D[M]>> }, module: M): ReturnType<D[M]>[];
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

const DEFAULT_STATE: CrudState<any, any> = {
	entities: {},
	byId: [],
}

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
	allKeys: <M extends ValidKeyof, I extends ValidKeyof>(state: { [S in M]: CrudState<any, I> }, module: M): I[] => {
		return state[module].byId
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
			}
			if (existingValue !== undefined) {
				newState.byId = [...state.byId, key]; // This is an insertion, not an update
			}
			newState.entities[key] = action.payload;
			return newState;
		} else if (checkMappedActionType(actionTypes, action, 'delete', module)) {
			const existingValue = state.entities[action.payload];
			if (existingValue === undefined) {
				return state;
			}
			const newState = {
				...state,
				entities: { ...state.entities },
				byId: [...state.byId],
			};
			const index = newState.byId.indexOf(action.payload);
			if (index < 0) {
				throw new Error('Inconsistent state! key was found in entity map, but not in byId map');
			}
			newState.byId.splice(index, 1);
			delete newState.entities[action.payload];
			return newState;
		} else if (checkMappedActionType(actionTypes, action, 'init', module)) {
			return action.payload[module] ? {
				...state,
				entities: Object.fromEntries((action.payload[module] as P[]).map((e): [I, P] => [getKey(e), e])) as Record<I, P>,
				byId: (action.payload[module] as P[]).map(getKey),
			} : state;
		} else if (checkMappedActionType(actionTypes, action, 'update', module)) {
			const key = action.payload.id;
			const existingValue = state.entities[key];
			if (existingValue === undefined) {
				//console.warn('Throwing away');
				//return state;
				throw new Error('Entity identified by key ' + key + ' does not exist for update action: ' + JSON.stringify(action));
			}
			const newState = {
				...state,
				entities: { ...state.entities },
			}
			newState.entities[key] = {
				...existingValue,
				...action.payload.data,
			} as P
			return newState;
		} else if (checkMappedActionType(actionTypes, action, 'concat', module)) {
			const key = action.payload.id;
			const existingValue = state.entities[key];
			if (existingValue === undefined) {
				//console.warn('Throwing away');
				//return state;
				throw new Error('Entity identified by key ' + key + ' does not exist for concat action: ' + JSON.stringify(action));
			}
			const newState = {
				...state,
				entities: { ...state.entities },
			}
			newState.entities[key] = {
				...existingValue,
				[action.payload.field]: (existingValue as P)[action.payload.field] + action.payload.data,
			} as P
			return newState;
		} else {
			return state;
		}
	}
}

function makeAction<F, T>(actionCreator: F, type: T): F & { type: T } {
	(actionCreator as F & { type: T }).type = type;
	return (actionCreator as F & { type: T });
}

export default function makeCrudModules<D extends Definition, A extends ActionTypes>(definitions: D, actionTypes: A): CrudStore<D, A> {
	const actions: {
		[K in Exclude<BaseActions<keyof D, any, any>['type'], 'init'>]: <M extends keyof D>(
			module: M,
			payload: FilterOnType<BaseActions<M, ReturnType<D[M]>, Parameters<D[M]>[0]>, { type: K }>['payload']
		) => RemapType<FilterOnType<BaseActions<M, ReturnType<D[M]>, Parameters<D[M]>[0]>, { type: K }>, A>
	} & {
		[K in 'init']: (initMap: {
			[M in keyof D]: Parameters<D[M]>[0][] | undefined
		}) => RemapType<FilterOnType<BaseActions<keyof D, Parameters<D[keyof D]>, ReturnType<D[keyof D]>>, { type: 'init' }>, A>
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


const test = makeCrudModules({
	store: (n: number) => n.toString(),
	blag: (n: {
		id: string,
		test: string,
		n: number,
	}) => n.id,
}, {
	persist: 'p',
	delete: 'd',
	update: 'u',
	init: 'i',
	concat: 'c'
} as const);

test.actions.persist
type T = Parameters<typeof test.actions.persist>[1];

test.actions.persist('store', 7)
const v = test.actions.persist('blag', {
	id: 'ddd',
	test: 'sss',
	n: 1234
})

type V = (typeof v)['type']


const t = test.actions.init({
	blag: [{
		id: 'ssss',
		test: 'ss',
		n: 99
	}],
	store: [1,2,3,4],
})
t.type

test.actions.concat('blag', {
	id: '1234',
	field: 'test',
	data: '+123'
})

type Z = (typeof test.actions.concat)