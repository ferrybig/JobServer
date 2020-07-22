export default function combineSelectors<I, M, O, A extends any[]>(a: (input: I) => M, b: (middle: M, ...args: A) => O): (input: I, ...args: A) => O {
	return (input, ...rest): O => {
		return b(a(input), ...rest);
	}
}
export const combineSelectors2 = combineSelectors;
export function combineSelectors3<I, M1, M2, O, A extends any[]>(
	a: (input: I) => M1,
	b: (middle: M1) => M2,
	c: (middle: M2, ...args: A) => O
): (input: I, ...args: A) => O {
	return (input, ...rest): O => {
		return c(b(a(input)), ...rest);
	}
}
export function combineSelectors4<I, M1, M2, M3, O, A extends any[]>(
	a: (input: I) => M1,
	b: (middle: M1) => M2,
	c: (middle: M2) => M3,
	d: (middle: M3, ...args: A) => O
): (input: I, ...args: A) => O {
	return (input, ...rest): O => {
		return d(c(b(a(input))), ...rest);
	}
}
