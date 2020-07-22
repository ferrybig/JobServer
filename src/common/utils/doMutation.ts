type Values<O> = O[keyof O];
type SelectIfUndefined<T, K> = T extends undefined ? K : never;
type OnlyUndefinedValues<O> = Values<{ [K in keyof O]: SelectIfUndefined<O[K], K>}>;
type RemoveUndefined<T> = T extends undefined ? never : T;

interface MutationBase<S, R> {
	<K extends keyof S>(key: K): MutationBase<RemoveUndefined<S[K]>, R>,
	set<K extends keyof S>(key: K, value: S[K]): R,
	update<K extends keyof S>(key: K, value: (input: RemoveUndefined<S[K]>) => S[K] | undefined): R,
	delete<K extends OnlyUndefinedValues<S>>(key: K): R,
	batch(...operations: ((input: MutationBase<S, S>) => S)[]): R,
}
function makeVoidMutationBase<S, R>(_: S, rootState: R): MutationBase<S, R> {
	function voidMutationSelecter<K extends keyof S>(_: K): MutationBase<RemoveUndefined<S[K]>, R> {
		return voidMutationSelecter as unknown as MutationBase<RemoveUndefined<S[K]>, R>;
	}
	voidMutationSelecter.set = (): R => {
		return rootState;
	}
	voidMutationSelecter.update = (): R => {
		return rootState;
	}
	voidMutationSelecter.delete = (): R => {
		return rootState;
	}
	voidMutationSelecter.batch = (): R => {
		return rootState;
	}
	return voidMutationSelecter;
}

function makeMutationBase<S, R>(state: S, toRootState: (state: S) => R, rootState: R): MutationBase<S, R> {
	function mutationSelecter<K extends keyof S>(key: K): MutationBase<RemoveUndefined<S[K]>, R> {
		const value = state[key];
		if (value === undefined) {
			return makeVoidMutationBase(state, rootState) as unknown as MutationBase<RemoveUndefined<S[K]>, R>;
		}
		return makeMutationBase(value as RemoveUndefined<typeof value>, (subState): R => {
			return toRootState({
				...state,
				[key]: subState
			});
		}, rootState);
	}
	mutationSelecter.set = <K extends keyof S>(key: K, value: S[K]): R => {
		return toRootState({
			...state,
			[key]: value,
		});
	};
	mutationSelecter.update = <K extends keyof S>(key: K, callback: (input: RemoveUndefined<S[K]>) => S[K] | undefined): R => {
		const value = state[key]
		if (value === undefined) {
			return rootState;
		}
		const newValue = callback(value as RemoveUndefined<S[K]>);
		if (newValue === undefined) {
			return mutationSelecter.delete(key)
		} else {
			return mutationSelecter.set(key, newValue);
		}
	};
	mutationSelecter.delete = <K extends keyof S>(key: K): R => {
		if (key in state) {
			const newState = {...state};
			delete newState[key];
			return toRootState(newState);
		} else {
			return rootState;
		}
	};
	mutationSelecter.batch = (...operations: ((input: MutationBase<S, S>) => S)[]): R => {
		let currentState = state;
		for (const operation of operations) {
			currentState = operation(doMutation(currentState));
		}
		return currentState === state ? rootState : toRootState(currentState);
	};
	return mutationSelecter;
}

const IDENTITY = <T>(input: T) => input;

export default function doMutation<S>(state: S) {
	return makeMutationBase<S, S>(state, IDENTITY, state);
}
