export default function pick<B extends object, K extends keyof B>(base: B, keys: K[]): Pick<B, K>;
export default function pick<B extends object, K extends keyof B, R extends object>(base: B, keys: K[], into: R): R & Pick<B, K>;
export default function pick<B extends object, K extends keyof B, R extends object>(base: B, keys: K[], into: R = ({} as R)): R & Pick<B, K> {
	const newObject: R & Partial<Pick<B, K>> = into;
	for (const key of keys) {
		(newObject as Partial<Pick<B, K>>)[key] = base[key];
	}
	return newObject as R & Pick<B, K>;
}
