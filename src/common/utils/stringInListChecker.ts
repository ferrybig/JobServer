type Limit = string | number

interface Tester<T extends Limit>{
	(toTest: Limit): toTest is T,
	types: readonly T[],
}

export default function stringInListChecker<T extends Limit>(map: Record<T, true>): Tester<T> {
	function test(toTest: Limit): toTest is T {
		return !!map[toTest as T];
	};
	test.types = Object.keys(map).filter(test) as T[];
	return test;
}
