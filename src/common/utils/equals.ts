import assertNever from './assertNever';

export function referenceEquals<T>(a: T, b: T): boolean {
	return a === b;
}

export function genericShallowEquals<T>(a: T, b: T, compare: <T>(a: T, b: T) => boolean): boolean {
	const aTtype = typeof a;
	const bType = typeof b;
	if (aTtype !== bType) {
		return false;
	}
	switch (aTtype) {
		case 'string':
		case 'number':
		case 'bigint':
		case 'boolean':
		case 'symbol':
		case 'undefined':
		case 'function':
			return referenceEquals(a, b);
		case 'object':
			const aArray = Array.isArray(a);
			const bArray = Array.isArray(b);
			if (aArray !== bArray) {
				return false;
			}
			if (aArray) {
				const aT = a as unknown as any[];
				const bT = b as unknown as any[];
				const aLength = aT.length;
				const bLength = bT.length;
				if (aLength !== bLength) {
					return false;
				}
				for (let i = 0; i < aLength; i++) {
					if (!compare(aT[i], bT[i])) {
						return false;
					}
				}
				return true;
			} else {
				const aT = a as any;
				const bT = b as any;
				const aKeys = Object.keys(aT);
				const bKeys = Object.keys(bT);
				const bKeysObj = Object.fromEntries(bKeys.map(e => [e, true]));
				if (aKeys.length !== bKeys.length) {
					return false;
				}
				for (const key of aKeys) {
					delete bKeysObj[key];
					if (!compare(aT[key], bT[key])) {
						return false;
					}
				}
				return Object.keys(bKeysObj).length === 0;
			}
		default:
			return assertNever(aTtype);
	}
}

export function shallowEquals<T>(a: T, b: T): boolean {
	return genericShallowEquals(a, b, referenceEquals);
}

export function deepEquals<T>(a: T, b: T): boolean {
	return genericShallowEquals(a, b, deepEquals);
}
