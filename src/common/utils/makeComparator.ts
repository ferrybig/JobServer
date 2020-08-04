type Values<T> = T[keyof T];
type KeysWhereValueExtends<B, T> = Values<{ [K in keyof B]: B[K] extends T ? K : never}>;

export default function makeComparator<T>(asending: boolean, ...functions: (((obj: T) => number | string | boolean) | KeysWhereValueExtends<T, string | number | boolean>)[]): (a: T, b: T) => -1 | 0 | 1 {
	const asFunctions = functions.map(e => typeof e === 'string' ? (obj: T) => obj[e] : e) as ((obj: T) => number | string | boolean)[];
	return function buildComparator(a, b) {
		for (const func of asFunctions) {
			const valA = func(a);
			const valB = func(b);
			if (valA < valB) return asending ? -1 : 1;
			if (valA > valB) return asending ? 1 : -1;
		}
		return 0;
	};
}
