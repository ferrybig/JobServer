import NavigationContext from '.';
import subscriptionFactory from '../../components/hooks/SubscriptionFactory';

export default subscriptionFactory(NavigationContext, (context) => context.getValue(), (context, handler) => context.onUpdate(handler));
