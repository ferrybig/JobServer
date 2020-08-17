export default function assert(condition: any, message?: string): asserts condition {
	if (!condition) {
		throw new Error(`${condition} is not truety${message ? `: ${message}` : ''}`);
	}
}
