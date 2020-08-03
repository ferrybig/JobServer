export default function throwIfNotDefined<T>(input: T): NonNullable<T> {
	if(input === undefined || input === null) {
		throw new Error('Value should not be undefined');
	}
	return input as NonNullable<T>;
}
