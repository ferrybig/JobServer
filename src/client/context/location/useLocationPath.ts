import subscriptionFactory from '../../components/hooks/SubscriptionFactory';
import LocationContext from '.';

export default subscriptionFactory(LocationContext, (context) => context.path(), (context, handler) => context.onUpdate(handler));
