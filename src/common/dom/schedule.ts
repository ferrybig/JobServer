type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
	timeout: number;
};
type RequestIdleCallbackDeadline = {
	readonly didTimeout: boolean;
	timeRemaining: (() => number);
};
interface ExpandedWindow extends Window {
	requestIdleCallback: ((
		callback: ((deadline: RequestIdleCallbackDeadline) => void),
		opts?: RequestIdleCallbackOptions,
	) => RequestIdleCallbackHandle);
	cancelIdleCallback: ((handle: RequestIdleCallbackHandle) => void);
}
type CancelFunction = () => void;

const newWindow = window as ExpandedWindow & typeof globalThis;

function makeFunction<R, A extends any[], T>(thisObject: T, schedule: (this: T, ...args: A) => R, cancel: (this: T, handle: R) => void): (...args: A) => CancelFunction {
	return (...args) => {
		const handle = schedule.apply(thisObject, args);
		return () => cancel.apply(thisObject, [handle]);
	};
}

export const requestIdleCallback = makeFunction(newWindow, newWindow.requestIdleCallback, newWindow.cancelIdleCallback);
export const requestAnimationFrame = makeFunction(newWindow, newWindow.requestAnimationFrame, newWindow.cancelAnimationFrame);
export const setTimeout = makeFunction(newWindow, newWindow.setTimeout, newWindow.clearTimeout);
export const setInterval = makeFunction(newWindow, newWindow.setInterval, newWindow.clearInterval);
