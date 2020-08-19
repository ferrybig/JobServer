import { useState, useLayoutEffect } from 'react';
import { EMPTY_FUNCTION } from '../../../common/utils/emptyObjects';
import assertNever from '../../../common/utils/assertNever';

export function wait(timeout: number): SimpleEffect {
	return {
		type: 'simple',
		execute(callback) {
			const handle = window.setTimeout(callback, timeout);
			return () => window.clearTimeout(handle);
		},
	};
}
export function onAnimation(): SimpleEffect {
	return {
		type: 'simple',
		execute(callback) {
			const handle = window.requestAnimationFrame(callback);
			return () => window.cancelAnimationFrame(handle);
		},
	};
}
export function set<T>(value: T): SetEffect<T> {
	return {
		type: 'set',
		value,
	};
}

type SimpleEffect = { type: 'simple'; execute: (callback: (value?: any) => void) => () => void };
type NoopEffect = { type: 'noop' };
type SetEffect<T> = { type: 'set'; value: T };
type AnyEffect<T> = SimpleEffect | NoopEffect | SetEffect<T>;

type InlineSaga<T> = () => Generator<AnyEffect<T>, void | (() => void), any>;

function useInlineSagaInternal<T>(code: InlineSaga<T>, setValue: (data: T) => void, deps: any[]): void {
	useLayoutEffect(() => {
		const iterator = code();
		let isDone = false;
		let cancelCurrentTask: (() => void) | null = null;
		const callIterator = (val?: any) => {
			cancelCurrentTask = null;
			nextStep(iterator.next(val));
		};
		function nextStep(res: IteratorResult<AnyEffect<T>, void | (() => void)>) {
			if (res.done) {
				cancelCurrentTask = res.value || null;
				isDone = true;
				return;
			}
			switch (res.value.type) {
				case 'set':
					setValue(res.value.value);
					nextStep(iterator.next());
					break;
				case 'simple':
					// We can't simply assign the result of `execute` to `cancelCurrentTask`, we could get a race condition
					// if `execute` resulses instantly
					let currentCancelCurrentTask: (() => void) | null = null;
					cancelCurrentTask = () => currentCancelCurrentTask?.();
					currentCancelCurrentTask = res.value.execute(callIterator);
					break;
				case 'noop':
					nextStep(iterator.next());
					break;
				default:
					return assertNever(res.value);
			}
		}
		callIterator();
		return () => {
			cancelCurrentTask?.();
			if (!isDone) {
				const val = iterator.return();
				if (!val.done) {
					console.error('Expected generator to to end after calling return!');
					while (!iterator.throw(new Error('Generator termination error')));
				} else if (val.value) {
					val.value();
				}

			}
		};
	});
}

export function useStatelessInlineSaga<D>(code: InlineSaga<never>, deps: any[]): void {
	return useInlineSagaInternal(code, EMPTY_FUNCTION, deps);
}
export default function useInlineSaga<T>(code: InlineSaga<T>, initialValue: T | (() => T), deps: any[]): T {
	const [state, setState] = useState<T>(initialValue);
	useInlineSagaInternal(code, setState, deps);
	return state;
}
