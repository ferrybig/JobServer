import { useContext } from 'react';
import { navigationContext, FinalContextValue } from '.';
import subscriptionFactory from '../components/hooks/SubscriptionFactory';

const useSubscription = subscriptionFactory((context: FinalContextValue) => context.getValue(), (context, handler) => context.onUpdate(handler));

export function useNavigationContextValues() {
	const context = useContext(navigationContext);
	return useSubscription(context);
}
