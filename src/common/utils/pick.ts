export default function pick<B extends object, K extends keyof B>(base: B, keys: K[]): Pick<B, K> {
	const newObject: Partial<Pick<B, K>> = {};
	for (const key of keys) {
		newObject[key] = base[key];
	}
	return newObject as Pick<B, K>;
}
