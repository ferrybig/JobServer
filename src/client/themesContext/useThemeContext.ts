import { useContext } from 'react';
import subscriptionFactory from '../components/hooks/SubscriptionFactory';
import ThemeContext from '.';

const useSubscription = subscriptionFactory((context: ThemeContext) => [context.getValue(), context.getClassname()] as const, (context, handler) => context.onUpdate(handler));

export function useThemeContext() {
	const context = useContext(ThemeContext);
	return useSubscription(context);
}
