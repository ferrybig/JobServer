import * as views from '../../common/views';
import { SubscriptionListChangeData, SubscriptionSingleChangeData } from '../../common/packets/clientPackets';
import assertNever from '../../common/utils/assertNever';
import throwIfNotDefined from '../../common/utils/throwIfNotDefined';
import { UpstreamServer } from '../UpstreamServer';

type ClientDataForView<V extends views.View<any>> =
	V['type'] extends 'list' ? V['entityData']['examples'][V['form']][] :
	V['type'] extends 'single' ? V['entityData']['examples'][V['form']] :
	never;

function subscriptionUpdater<V extends views.View<any>>(subscription: SubscriptionHandler<V>, data: SubscriptionListChangeData | SubscriptionSingleChangeData) {
	subscription.hasReceivedData = true;
	switch (subscription.view.type) {
	case 'list':
		const listData = data as SubscriptionListChangeData;
		switch (listData.type) {
		case 'replace':
			subscription.value = listData.data as ClientDataForView<V>;
			break;
		case 'delete':
			const array1 = [...throwIfNotDefined(subscription.value) as V['entityData']['forms'][V['form']][]];
			array1.splice(listData.index, 1);
			subscription.value = array1 as ClientDataForView<V>;
			break;
		case 'update':
			const array2 = [...throwIfNotDefined(subscription.value) as V['entityData']['forms'][V['form']][]];
			array2[listData.index] = listData.data;
			subscription.value = array2 as ClientDataForView<V>;
			break;
		case 'insert':
			const array3 = [...throwIfNotDefined(subscription.value) as V['entityData']['forms'][V['form']][]];
			array3.splice(listData.index, 0, listData.data);
			subscription.value = array3 as ClientDataForView<V>;
			break;
		default:
			return assertNever(listData);
		}
		break;
	case 'single':
		const singleData = data as SubscriptionSingleChangeData;
		switch (singleData.type) {
		case 'replace':
			subscription.value = singleData.data;
			break;
		case 'update':
			subscription.value = {
				...throwIfNotDefined(subscription.value),
				...singleData.data,
			} as ClientDataForView<V> ;
			break;
		case 'concat':
			const copy = {
				...throwIfNotDefined(subscription.value),
			} as unknown as ClientDataForView<V>;
			for (const [key, value] of Object.entries(singleData.data)) {
				copy[key] = value;
			}
			subscription.value = copy;
			break;
		default:
			return assertNever(singleData);
		}
		break;
	default:
		return assertNever(subscription.view.type);
	}
	for (const follower of subscription.followers) {
		follower(subscription.value);
	}
}

interface ClientView<V extends views.View<any>> {
	(subscribe: (data: ClientDataForView<V> | null) => void, ...options: ReturnType<V['argsHandler']>):() => void
}
interface SubscriptionHandler<V extends views.View<any>> {
	key: string,
	requestId: number;
	followers: ((data: ClientDataForView<V> | null) => void)[];
	args: string[];
	value: ClientDataForView<V> | null;
	view: V;
	wantsSubscription: boolean;
	viewName: string,
	hasReceivedData: boolean,
}

function makeClientHandlers<V extends Record<any, views.View<any, any, any, any>>>(views: V, options: {}): { clientViews: { [K in keyof V]: ClientView<V[K]> }, register(server: UpstreamServer): void  } {
	let subscriptionMap: Partial<Record<number, SubscriptionHandler<any>>> = {};
	let handlerMap: Partial<Record<string, SubscriptionHandler<any>>> = {};
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

	function getOrCreateSubscriptionHandler<K extends keyof V>(viewName: K, view: views.View<any>, args: string[], wantsSubscription: boolean): SubscriptionHandler<V[K]> {
		const subscriptionKey = JSON.stringify([wantsSubscription, viewName, ...args]);
		let subscription: SubscriptionHandler<any> | null = null;
		if (!wantsSubscription) {
			const extraSubscriptionKey = JSON.stringify([true, viewName, ...args]);
			subscription = handlerMap[subscriptionKey] || handlerMap[extraSubscriptionKey] || null;
		} else {
			subscription = handlerMap[subscriptionKey] || null;
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
					server?.sendPacket({
						type: 'entity-end',
						requestId: subscription.requestId
					});
					delete subscriptionMap[subscription.requestId];
					delete handlerMap[subscription.key];
				}
			}
		};
	}
	const clientViews: Partial<{ [K in keyof V]: ClientView<V[K]> }> = {};
	for (const [key, value] of Object.entries(views)) {
		clientViews[key as keyof V] = ((handler: (data: ClientDataForView<V[keyof V]> | null) => void, ...args: string[]) => {
			const wantsSubscription = true;
			const subscription = getOrCreateSubscriptionHandler(key, value, args, wantsSubscription);

			if (subscription.hasReceivedData) {
				handler(subscription.value);
				if (!wantsSubscription) {
					return () => {};
				}
			}
			if (wantsSubscription) {
				subscription.followers.push(handler);
				return unsubscribeHandler(subscription, handler);
			} else {
				let unsubscribe: () => void;
				const newHandler = (data: ClientDataForView<V[keyof V]> | null) => {
					handler(data);
					unsubscribe();
				};
				subscription.followers.push(newHandler);
				return unsubscribeHandler(subscription, newHandler);
			}
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
