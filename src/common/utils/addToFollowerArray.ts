interface SimpleArray<T> {
	push(item: T): number;
	indexOf(item: T): number;
	splice(index: number, count: 1): T[];
}

export default function addToFollowerArray<F extends (...args: any[]) => any>(array: SimpleArray<F>, newElement: F): () => void {
	array.push(newElement);
	return () => {
		const index = array.indexOf(newElement);
		if (index >= 0) {
			array.splice(index, 1);
		}
	};
}
