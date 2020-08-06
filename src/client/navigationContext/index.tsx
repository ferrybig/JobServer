import React, { createContext, FC, useRef, useMemo } from 'react';
import { addToFollowerArray } from '../../common/utils/addToFollowerArray';
import callArray from '../../common/utils/callArray';

export interface ContextValue {
	backLink: string | null,
	pageName: string,
}

const DEFAULT_CONTEXT_VALUE: ContextValue = {
	backLink: null,
	pageName: '',
};

export interface FinalContextValue {
	getValue(): ContextValue,
	onUpdate(follower: () => void): () => void
	setValues(values: Partial<ContextValue>): () => void
}
type RefCounts = Record<keyof ContextValue, number>;

export const navigationContext = createContext<FinalContextValue>({
	getValue() {
		throw new Error('No instance of ' + navigationContext.displayName + ' has been found inside the parent stack');
	},
	setValues() {
		return () => {};
	},
	onUpdate() {
		return () => {};
	}
});

if (process.env.NODE_ENV === 'development') {
	navigationContext.displayName = 'NavigationContext';
}


const NavigationContextProvider: FC = ({ children }): JSX.Element => {

	const values = useRef<ContextValue>(DEFAULT_CONTEXT_VALUE);
	const refCounts = useRef<RefCounts>({
		backLink: 0,
		pageName: 0,
	});
	const followers = useRef<(() => void)[]>([]);
	const final = useMemo((): FinalContextValue => ({
		getValue() {
			return values.current;
		},
		onUpdate(follower) {
			return addToFollowerArray(followers.current, follower);
		},
		setValues(newValues) {
			const counts: Partial<RefCounts> = {};
			let modified = false;
			const clone = { ...values.current };
			for (const [key, value] of Object.entries(newValues) as [keyof ContextValue, any][]) {
				if (values.current[key] !== value) {
					clone[key] = value;
					modified = true;
				}
				counts[key] = ++refCounts.current[key];
			}
			if (modified) {
				values.current = clone;
				callArray(followers.current);
			}
			return () => {
				let modified = false;
				const clone = { ...values.current };
				for (const key of Object.keys(newValues) as (keyof ContextValue)[]) {
					if (counts[key] === refCounts.current[key]) {
						if (values.current[key] !== DEFAULT_CONTEXT_VALUE[key] as any) {
							clone[key] = DEFAULT_CONTEXT_VALUE[key] as any;
							modified = true;
						}
					}
				}
				if (modified) {
					values.current = clone;
					callArray(followers.current);
				}
			};
		}
	}), []);

	return (
		<navigationContext.Provider value={final}>
			{children}
		</navigationContext.Provider>
	);
};

export default NavigationContextProvider;
