import LoginContext from '.';
import { subscriptionFactoryWithMemo } from '../../components/hooks/SubscriptionFactory';

export default subscriptionFactoryWithMemo(LoginContext, (context) => ({
	value: context.getValue(),
	doLogin: context.doLogin,
	loginUrl: context.loginUrl(),
}), (context, handler) => context.onUpdate(handler));
