export default function pickFirstNonNullCount<
	K extends string | number | symbol,
	T extends { readonly [K1 in K]: string | number | symbol },
	M extends { readonly [K1 in T[K]]: V },
	V,
	R
>(objects: T[], key: K, map: M, values: readonly V[], defaultValue: R): [V, number] | [R, 0] {
	if (objects.length === 0) {
		return [defaultValue, 0];
	}
	for (const v of values) {
		const count = objects.filter(o => map[o[key]] === v).length;
		if (count > 0) {
			return [v, count];
		}
	}
	return [defaultValue, 0];
}
