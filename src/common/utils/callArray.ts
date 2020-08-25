export default function callArray<A extends any[], R>(array: ReadonlyArray<(...args: A) => R>, ...args: A): R[] {
	return array.map(func => func(...args));
}
