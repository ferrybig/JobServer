import { useState, useLayoutEffect, Context, useContext } from 'react';
import { shallowEquals } from '../../../common/utils/equals';

export default function subscriptionFactory<C, V>(context: Context<C>, getValue: (context: C) => V, subscribe: (context: C, handler: () => void) => () => void, name = 'useSubscription'): () => V {
	function useSubscription() {
		const contextValue = useContext(context);
		const [state, setState] = useState<V>(getValue(contextValue));
		useLayoutEffect(() => subscribe(contextValue, () => {
			setState(getValue(contextValue));
		}), [contextValue, setState]);
		return state;
	}
	useSubscription.toString = () => `${useSubscription.name}For${context.displayName}`;
	return useSubscription;
}

export function subscriptionFactoryWithMemo<C, V>(context: Context<C>, getValue: (context: C) => V, subscribe: (context: C, handler: () => void) => () => void, name = 'useSubscription'): () => V {
	function useSubscriptionWithMemo() {
		const contextValue = useContext(context);
		const [state, setState] = useState<V>(getValue(contextValue));
		useLayoutEffect(() => subscribe(contextValue, () => {
			const val = getValue(contextValue);
			setState(state => shallowEquals(state, val) ? state : val);
		}), [contextValue, setState]);
		return state;
	}
	useSubscriptionWithMemo.toString = () => `${useSubscriptionWithMemo.name}For${context.displayName}`;
	return useSubscriptionWithMemo;
}
