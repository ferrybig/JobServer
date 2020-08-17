import { useState, useEffect } from 'react';
import { ViewOptions } from './views';

export type UseView<D, R> = {
	status: 'loading';
	data: R;
} | {
	status: 'success';
	data: D;
} | {
	status: 'not-found';
	data: R;
};

type MapArguments<A extends string[]> =
	/* 0 */ A extends [] ? [] :
	/* 1 */ A extends [string] ? [string | null] :
	/* 2 */ A extends [string, string] ? [string | null, string | null] :
	/* 3 */ A extends [string, string, string] ? [string | null, string | null, string | null] :
	/* 4 */ A extends [string, string, string, string] ? [string | null, string | null, string | null, string | null] :
	(string | null)[];

interface ViewOptionsWithDefault<R> extends ViewOptions {
	defaultValue: R;
}

export default function useView<A extends string[], D, R>(
	view: (handler: (data: D | null) => void, options: ViewOptions, ...args: A) => () => void,
	options: ViewOptionsWithDefault<R>,
	...args: MapArguments<A>
): UseView<D, R>;
export default function useView<A extends string[], D>(
	view: (handler: (data: D | null) => void, options: ViewOptions, ...args: A) => () => void,
	options: ViewOptions,
	...args: MapArguments<A>
): UseView<D, null>;
export default function useView<A extends string[], D, R>(
	view: (handler: (data: D | null) => void, options: ViewOptions, ...args: A) => () => void,
	options: ViewOptions | ViewOptionsWithDefault<R>,
	...args: MapArguments<A>
): UseView<D, R> {
	const {
		noSubscribe
	} = options;
	const [value, setValue] = useState<UseView<D, R>>({
		status: 'loading',
		data: 'defaultValue' in options ? options.defaultValue : (null as unknown as R),
	});
	useEffect(() => {
		if (args.indexOf(null) >= 0) {
			return;
		}
		return view((data: D | null) => {
			if (data === null) {
				setValue((oldState) => oldState.status === 'loading' ? { ...oldState, status: 'not-found' } : oldState);
			} else {
				setValue({
					status: 'success',
					data,
				});
			}
		}, { noSubscribe }, ...args as string[] as A);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, setValue, noSubscribe, ...args]); // TODO use JSON.stringify here if we want to support length changing of the options list
	return value;
}
