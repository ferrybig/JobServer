import { createContext } from 'react';
import { addToFollowerArray } from '../../../common/utils/addToFollowerArray';
import callArray from '../../../common/utils/callArray';
import subscriptionDebug from '../../../common/utils/subscriptionDebug';

export interface ContextValue {
	backLink: string | null;
	pageName: string;
}

const DEFAULT_CONTEXT_VALUE: ContextValue = {
	backLink: null,
	pageName: '',
};

interface NavigationContext {
	getValue(): ContextValue;
	onUpdate(follower: () => void): () => void;
	setValues(values: Partial<ContextValue>): () => void;
}
type RefCounts = Record<keyof ContextValue, number>;

const NavigationContext = createContext<NavigationContext>({
	getValue() {
		throw new Error('No instance of ' + NavigationContext.displayName + ' has been found inside the parent stack');
	},
	setValues() {
		return () => {};
	},
	onUpdate() {
		return () => {};
	}
});

if (process.env.NODE_ENV === 'development') {
	NavigationContext.displayName = 'NavigationContext';
}

export function makeNavigationContext(): NavigationContext {
	let values: ContextValue = DEFAULT_CONTEXT_VALUE;
	const followers: (() => void)[] = [];
	const refCounts: RefCounts = {
		backLink: 0,
		pageName: 0,
	};
	const value: NavigationContext = {
		getValue() {
			return values;
		},
		onUpdate(follower) {
			return addToFollowerArray(followers, follower);
		},
		setValues(newValues) {
			const counts: Partial<RefCounts> = {};
			let modified = false;
			const clone = { ...values };
			for (const [key, value] of Object.entries(newValues) as [keyof ContextValue, any][]) {
				if (values[key] !== value) {
					clone[key] = value;
					modified = true;
				}
				counts[key] = ++refCounts[key];
			}
			if (modified) {
				values = clone;
				callArray(followers);
			}
			return () => {
				let modified = false;
				const clone = { ...values };
				for (const key of Object.keys(newValues) as (keyof ContextValue)[]) {
					if (counts[key] === refCounts[key]) {
						if (values[key] !== DEFAULT_CONTEXT_VALUE[key] as any) {
							clone[key] = DEFAULT_CONTEXT_VALUE[key] as any;
							modified = true;
						}
					}
				}
				if (modified) {
					values = clone;
					callArray(followers);
				}
			};
		}
	};
	if (process.env.NODE_ENV === 'development') {
		value.onUpdate(subscriptionDebug(NavigationContext.displayName, () => value.getValue()));
	}
	return value;
}

export default NavigationContext;
