const counters: Record<string, number | undefined> = {};

function getAndIncrement<K extends PropertyKey>(map: Record<K, number | undefined>, key: K): number {
	const val = map[key];
	if (!val) {
		map[key] = 1;
		return 0;
	}
	map[key] = val! + 1;
	return val!;
}

export default function subscriptionDebug(moduleName: string | undefined, getVal: () => any): () => void {
	const id = getAndIncrement(counters, `${moduleName}`);
	let i = 0;
	function log() {
		const val = getVal();
		console.info(`[${moduleName} ${id}:${i++}]`, val);
	}
	log();
	return log;
}
