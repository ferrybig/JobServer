import subscriptionFactory from '../components/hooks/SubscriptionFactory';
import ThemeContext from '.';

export default subscriptionFactory(ThemeContext, (context) => [context.getValue(), context.getClassname()] as const, (context, handler) => context.onUpdate(handler));
