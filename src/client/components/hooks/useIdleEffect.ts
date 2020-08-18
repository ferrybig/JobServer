import { useEffect } from 'react';

type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
	timeout: number;
};
type RequestIdleCallbackDeadline = {
	readonly didTimeout: boolean;
	timeRemaining: (() => number);
};
interface ExpandedWindow extends Window {
	requestIdleCallback?: ((
		callback: ((deadline: RequestIdleCallbackDeadline) => void),
		opts?: RequestIdleCallbackOptions,
	) => RequestIdleCallbackHandle);
	cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
}
const newWindow = window as unknown as ExpandedWindow;

export default function useIdleEffect(callback: () => void | (() => void), deps: any[]): void {
	useEffect(() => {
		if (newWindow.requestIdleCallback) {
			const id = newWindow.requestIdleCallback(callback);
			return () => newWindow.cancelIdleCallback(id);
		} else {
			const id = newWindow.setTimeout(callback, 1);
			return () => newWindow.clearTimeout(id);
		}
		// The caller is responsible
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}
