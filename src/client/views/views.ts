import * as views from '../../common/views';
import { AnyView, ClientDataForView, ViewArgs, PacketsForView, View } from '../../common/views';
import assertNever from '../../common/utils/assertNever';
import throwIfNotDefined from '../../common/utils/throwIfNotDefined';
import { UpstreamServer } from '../UpstreamServer';

type SubscriptionUpdater<V extends AnyView> = (subscription: SubscriptionHandler<V>, data: PacketsForView<V>) => void;
const subscriptionUpdaters: {
	[T in AnyView['type']]: SubscriptionUpdater<View<T, any, any, string[]>>;
} = {
	single(subscription, data) {
		subscription.hasReceivedData = true;
		switch (data.type) {
			case 'replace':
				subscription.value = data.data;
				break;
			case 'update':
				subscription.value = {
					...throwIfNotDefined(subscription.value),
					...data.data,
				};
				break;
			case 'concat':
				const copy = {
					...throwIfNotDefined(subscription.value),
				};
				for (const [key, value] of Object.entries(data.data)) {
					copy[key] = value;
				}
				subscription.value = copy;
				break;
			default:
				return assertNever(data);
		}
	},
	list(subscription, data) {
		switch (data.type) {
			case 'replace':
				subscription.value = data.data;
				break;
			case 'delete':
				const array1 = [...throwIfNotDefined(subscription.value)];
				array1.splice(data.index, 1);
				subscription.value = array1;
				break;
			case 'update':
				const array2 = [...throwIfNotDefined(subscription.value)];
				array2[data.index] = { ...array2[data.index], ...data.data };
				subscription.value = array2;
				break;
			case 'insert':
				const array3 = [...throwIfNotDefined(subscription.value)];
				array3.splice(data.index, 0, data.data);
				subscription.value = array3;
				break;
			default:
				return assertNever(data);
		}
	}
};

function subscriptionUpdater<V extends AnyView>(subscription: SubscriptionHandler<V>, data: PacketsForView<V>) {
	(subscriptionUpdaters[subscription.view.type] as SubscriptionUpdater<AnyView>)(subscription, data);
	for (const follower of subscription.followers) {
		follower(subscription.value);
	}
}

export interface ViewOptions {
	noSubscribe?: boolean;
}

interface ClientView<V extends AnyView> {
	(subscribe: (data: ClientDataForView<V> | null) => void, options?: ViewOptions, ...args: ViewArgs<V>): () => void;
}
interface SubscriptionHandler<V extends AnyView> {
	key: string;
	requestId: number;
	followers: ((data: ClientDataForView<V> | null) => void)[];
	args: string[];
	value: ClientDataForView<V> | null;
	view: V;
	wantsSubscription: boolean;
	viewName: string;
	hasReceivedData: boolean;
}

function makeClientHandlers<V extends Record<any, views.View<any, any, any, any>>>(views: V, options: {}): { clientViews: { [K in keyof V]: ClientView<V[K]> }; register(server: UpstreamServer): void  } {
	const subscriptionMap: Partial<Record<number, SubscriptionHandler<any>>> = {};
	const handlerMap: Partial<Record<string, SubscriptionHandler<any>>> = {};
	let newRequestId = 0;

	let server: UpstreamServer | null = null;

	function sendSubscription(subscription: SubscriptionHandler<any>) {
		if (server) {
			server.sendPacket({
				type: 'entity-request',
				requestId: subscription.requestId,
				viewId: subscription.viewName,
				args: subscription.args,
				wantsSubscription: subscription.wantsSubscription
			});
		}
	}

	function getOrCreateSubscriptionHandler<K extends keyof V>(viewName: K, view: AnyView, args: string[], wantsSubscription: boolean): SubscriptionHandler<V[K]> {
		const subscriptionKey = JSON.stringify([wantsSubscription, viewName, ...args]);
		let subscription: SubscriptionHandler<any> | null = null;
		if (!wantsSubscription) {
			const extraSubscriptionKey = JSON.stringify([true, viewName, ...args]);
			subscription = handlerMap[subscriptionKey] ?? handlerMap[extraSubscriptionKey] ?? null;
		} else {
			subscription = handlerMap[subscriptionKey] ?? null;
		}
		if (subscription === null) {
			const newSubscription: SubscriptionHandler<any> = {
				key: subscriptionKey,
				requestId: newRequestId++,
				followers: [],
				args: [...args],
				value: null,
				view,
				wantsSubscription,
				viewName: `${viewName}`,
				hasReceivedData: false,
			};
			handlerMap[subscriptionKey] = newSubscription;
			subscriptionMap[newSubscription.requestId] = newSubscription;
			sendSubscription(newSubscription);
			return newSubscription;
		}
		return subscription;
	}
	function unsubscribeHandler(subscription: SubscriptionHandler<any>, handler: (data: any) => void): () => void {
		return () => {
			const index = subscription.followers.indexOf(handler);
			if (index >= 0) {
				subscription.followers.splice(index, 1);
				if (subscription.followers.length === 0) {
					window.setTimeout(() => {
						if (subscription.followers.length === 0 && handlerMap[subscription.key] === subscription) {
							delete subscriptionMap[subscription.requestId];
							delete handlerMap[subscription.key];
							server?.sendPacket({
								type: 'entity-end',
								requestId: subscription.requestId
							});
						}
					}, 100);
				}
			}
		};
	}
	const clientViews: Partial<{ [K in keyof V]: ClientView<V[K]> }> = {};
	for (const [key, value] of Object.entries(views)) {
		clientViews[key as keyof V] = ((handler: (data: ClientDataForView<V[keyof V]> | null) => void, options: ViewOptions = {}, ...args: string[]) => {
			const wantsSubscription = !options.noSubscribe ?? false;
			const subscription = getOrCreateSubscriptionHandler(key, value, args, wantsSubscription);

			if (subscription.hasReceivedData) {
				handler(subscription.value);
				if (!wantsSubscription) {
					return () => {};
				}
			}
			subscription.followers.push(handler);
			return unsubscribeHandler(subscription, handler);
		}) as any;
	}
	return {
		clientViews: clientViews as { [K in keyof V]: ClientView<V[K]> },
		register(serverInstance) {
			serverInstance.registerStateHandler('connected', () => {
				server = serverInstance;
				for (const subscription of Object.values(subscriptionMap)) {
					sendSubscription(subscription!);
				}
			});
			serverInstance.registerStateHandler('connectionLost', () => {
				server = null;
			});
			serverInstance.registerPacketHandler('entity-data', (packet) => {
				const subscription = subscriptionMap[packet.requestId];
				if (!subscription) {
					console.warn('Received rogue data packet', packet, subscriptionMap);
					serverInstance.sendPacket({
						type: 'entity-end',
						requestId: packet.requestId,
					});
					return;
				}
				subscriptionUpdater(subscription, packet.data);
			});
			serverInstance.registerPacketHandler('entity-end', (packet) => {
				const subscription = subscriptionMap[packet.requestId];
				if (!subscription) {
					console.warn('Received rogue end packet', packet, subscriptionMap);
					return;
				}
				delete subscriptionMap[packet.requestId];
				if (!subscription.hasReceivedData) {
					subscription.value = null;
					for (const follower of subscription.followers) {
						follower(null);
					}
				}
			});
		},
	};
}

export type ViewData<V extends ClientView<any>> = NonNullable<Parameters<Parameters<V>[0]>[0]>;

const { clientViews, register } = makeClientHandlers(views, {});

export const registerViewsToServer = register;

export default clientViews;
