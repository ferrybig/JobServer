import { useState, useEffect } from 'react';

export type UseView<D, R> = {
	status: 'loading',
	data: R,
} | {
	status: 'success',
	data: D,
} | {
	status: 'not-found',
	data: R,
};

type MapArguments<A extends string[]> =
	A extends [] ? [] :
	A extends [string] ? [string | null] :
	A extends [string, string] ? [string | null, string | null] :
	A extends [string, string, string] ? [string | null, string | null, string | null] :
	A extends [string, string, string, string] ? [string | null, string | null, string | null, string | null] :
	(string | null)[];

export function useOptionalView<A extends string[], D, R>(
	view: (handler: (data: D | null) => void, ...options: A) => () => void,
	defaultValue: R,
	...options: MapArguments<A>
): UseView<D, R> {
	const [value, setValue] = useState<UseView<D, R>>({
		status: 'loading',
		data: defaultValue,
	});
	useEffect(() => {
		if (options.indexOf(null)) {
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
		}, ...options as unknown as A);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, setValue, ...options]); // TODO use JSON.stringify here if we want to support length changing of the options list
	return value;
}


export default function useView<A extends string[], D, R>(
	view: (handler: (data: D | null) => void, ...options: A) => () => void,
	defaultValue: R,
	...options: A
): UseView<D, R> {
	const [value, setValue] = useState<UseView<D, R>>({
		status: 'loading',
		data: defaultValue,
	});
	useEffect(() => {
		return view((data: D | null) => {
			if (data === null) {
				setValue((oldState) => oldState.status === 'loading' ? { ...oldState, status: 'not-found' } : oldState);
			} else {
				setValue({
					status: 'success',
					data,
				});
			}
		}, ...options);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, setValue, ...options]); // TODO use JSON.stringify here if we want to support length changing of the options list
	return value;
}
