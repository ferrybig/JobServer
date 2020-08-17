import { useState, useLayoutEffect } from 'react';

export default function subscriptionFactory<C, V>(getValue: (context: C) => V, subscribe: (context: C, handler: () => void) => () => void, name = 'useSubscription'): (context: C) => V {
	function useSubscription(context: C) {
		const [state, setState] = useState<V>(getValue(context));
		useLayoutEffect(() => subscribe(context, () => {
			setState(getValue(context));
		}), [context, setState]);
		return state;
	};
	return useSubscription;
}
