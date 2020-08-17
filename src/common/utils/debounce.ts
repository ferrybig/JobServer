export default function debounce<T extends (...args: any) => any>(
	func: T,
	wait: number,
	combine: (newParameters: Parameters<T>, oldParameters: Parameters<T>) => Parameters<T> = (newParameters) => newParameters
): ((...args: Parameters<T>) => void) & { flush(): void } {
	let nextCall: {
		timer: ReturnType<typeof setTimeout>;
		args: Parameters<T>;
	} | null = null;
	const flush = (): void => {
		if (nextCall) {
			const localNextCall = nextCall;
			nextCall = null;
			clearTimeout(localNextCall.timer);
			func(...(localNextCall.args as any[]));
		}
	};
	const debounced = (...args: Parameters<T>): void => {
		if (nextCall !== null) {
			clearTimeout(nextCall.timer);
			nextCall.args = combine(args, nextCall.args);
			nextCall.timer = setTimeout(flush, wait);
		} else {
			nextCall = {
				timer: setTimeout(flush, wait),
				args,
			};
		}
	};
	debounced.flush = flush;
	return debounced;
}
