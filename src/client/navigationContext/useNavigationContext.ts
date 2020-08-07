import { useContext } from 'react';
import NavigationContext from '.';
import subscriptionFactory from '../components/hooks/SubscriptionFactory';

const useSubscription = subscriptionFactory((context: NavigationContext) => context.getValue(), (context, handler) => context.onUpdate(handler));

export function useNavigationContextValues() {
	const context = useContext(NavigationContext);
	return useSubscription(context);
}
