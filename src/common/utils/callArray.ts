export default function callArray<A extends any[]>(array: ReadonlyArray<(...args: A) => any>, ...args: A) {
	for (const func of array) {
		func(...args);
	}
}
