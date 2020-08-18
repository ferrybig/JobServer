import { subscriptionFactoryWithMemo } from '../../components/hooks/SubscriptionFactory';
import LocationContext from '.';

export default subscriptionFactoryWithMemo(LocationContext, (context) => ({
	path: context.path(),
	historyIndex: context.historyIndex(),
	lastInteraction: context.lastInteraction(),
}), (context, handler) => context.onUpdate(handler));
