export default function provideDefaults<T extends object>(partial: Partial<T>, defaults: T): T {
	return Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, partial[k as keyof Partial<T>] === undefined ? v : partial[k as keyof Partial<T>]])) as T;
}
