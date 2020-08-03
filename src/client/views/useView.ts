import {useState, useEffect} from "react"

type UseResult<D, R> = {
	status: 'loading',
	data: R,
} | {
	status: 'success',
	data: D,
} | {
	status: 'not-found',
	data: R,
}

export default function useView<A extends string[], D, R>(
	view: (handler: (data: D | null) => void, ...options: A) => () => void,
	defaultValue: R,
	...options: A
): UseResult<D, R> {
	const [value, setValue] = useState<UseResult<D, R>>({
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
	}, [view, setValue, JSON.stringify(options)]);
	return value;
}
