type Arg1<F extends (...args: any[]) => any> = F extends (first: infer R, ...args: any[]) => any ? R : never;
type StripArg1<F extends (...args: any[]) => any> = F extends (first: any, ...args: infer R) => any ? R : never;

interface ThenableSelector<S, K extends keyof S> {
	(state: S): S[K],
	connect<F extends (state: S[K], ...rest: A) => any, A extends any[]>(next: F): (state: Record<K, Arg1<F>>, ...rest: StripArg1<F>) => ReturnType<F>
}

export function keySelector<S>(): <K extends keyof S>(key: K) => ThenableSelector<S, K> {
	return function keySelectorBuilder<K extends keyof S>(key: K): ThenableSelector<S, K> {
		function keySelectorCaller(state: Pick<S, K>): S[K] {
			return state[key];
		}
		keySelectorCaller.connect = <F extends (state: S[K], ...rest: A) => any, A extends any[]>(
			next: F
		): (state: Record<K, Arg1<F>>, ...rest: A) => ReturnType<F> => {
			return (state: Record<K, Arg1<F>>, ...rest: A): ReturnType<F> => {
				return next(state[key], ...rest);
			}
		}
		return keySelectorCaller;
	}
}
