import * as views from '../../../common/views';
import { State } from '../../store/reducer';
import { getOrNull, allValues, filter } from '../../store/selectors';
import * as actions from '../../store/actions';
import Values from '../../../common/utils/Values';
import { ModuleKeys, getIdFromEntity } from '../../store/crud';
import { EntityDataPacket, SubscriptionSingleChangeData, SubscriptionListChangeData } from '../../../common/packets/clientPackets';
import assertNever from '../../../common/utils/assertNever';
import { AnyView, ViewArgs, ServerDataForView, View } from '../../../common/views';

type ActionMap<P extends any[], A extends { type: string; (...args: any): any } = Values<typeof actions>> = {
	[K in A['type']]?: true | ((action: ReturnType<Extract<A, { type: K }>>, ...args: P) => boolean)
};

type AllActions = ReturnType<Values<typeof actions>>;

export type Follower = Iterator<EntityDataPacket['data'][], void, [AllActions, State]>;

type ServerView<V extends AnyView> = {
	select: (state: State, args: ViewArgs<V>) => ServerDataForView<V> | null;
	view: V;
	updateMap: ActionMap<ViewArgs<V>>;
	makeFollower(initState: State, permissions: Record<string, boolean>, args: ViewArgs<V>): Follower;
};

function executeFilter<A extends any[]>(updateMap: ActionMap<A>, action: AllActions, args: A): boolean {
	const filter = updateMap[action?.type];
	switch (typeof filter) {
		case 'boolean':
			return filter;
		case 'function':
			return filter(action as any, ...args);
		case 'undefined':
			return false;
		default:
			return assertNever(filter);
	}
}

function filterObject<T extends object>(obj: Partial<T>, check: (key: keyof T) => boolean, old: T): Partial<T> {
	return Object.fromEntries(Object.entries(obj).filter(([key, value]) => check(key as keyof T) && !Object.is(value, (old as any)[key]))) as Partial<T>;
}

const followerMap: {
	[T in AnyView['type']]: <V extends View<T, object, object, string[]> = View<T, object, object, string[]>>(
		serverView: Omit<ServerView<V>, 'makeFollower'>,
		initState: State,
		args: ViewArgs<V>
	) => Follower
} = {
	*single(serverView, initState, args) {
		let baseValue = serverView.select(initState, args);
		if (baseValue === null) {
			return;
		}
		const packets: SubscriptionSingleChangeData<any>[] = [{
			type: 'replace',
			data: serverView.view.parser.format(baseValue as any),
		}];
		while (true) {
			const [action, state] = yield packets;
			packets.length = 0;
			const filterStatus = executeFilter(serverView.updateMap, action, args);
			if (!filterStatus) {
				continue;
			}
			const newBaseValue = serverView.select(state, args);
			if (newBaseValue === null) {
				return;
			}
			switch (action.type) {
				case 'update':
					packets.push({
						type: 'update',
						data: serverView.view.parser.formatPartial(baseValue as any),
					});
					break;
				case 'concat':
					if (serverView.view.parser.isKeyAllowed(action.payload.field)) {
						packets.push({
							type: 'concat',
							data: {
								[action.payload.field]: action.payload.data,
							},
						});
					}
					break;
				default:
					const changes: Partial<Record<string, any>> = {};
					for (const [key, value] of Object.entries(newBaseValue as object)) {
						const bValue = baseValue[key as keyof typeof baseValue];
						if (value !== bValue) {
							changes[key] = value;
						}
					}
					packets.push({
						type: 'update',
						data: changes,
					});
					break;
			}
			baseValue = newBaseValue;
		}
	},
	*list(serverView, initState, args) {
		let baseValue = serverView.select(initState, args) as object[] | null;
		if (baseValue === null) {
			return;
		}
		const packets: SubscriptionListChangeData<any>[] = [{
			type: 'replace',
			data: baseValue.map(serverView.view.parser.format),
		}];
		while (true) {
			const [action, state] = yield packets;
			packets.length = 0;
			const filterStatus = executeFilter(serverView.updateMap, action, args);
			if (!filterStatus) {
				continue;
			}
			const newBaseValue = serverView.select(state, args) as object[] | null;
			if (newBaseValue === null) {
				return;
			}
			let gaveUp = false;
			switch (action.type) {
				case 'update':
					if (newBaseValue.length !== baseValue.length) {
						gaveUp = true;
						break;
					}
					for (let i = 0; i < baseValue.length; i++) {
						if (baseValue[i] !== newBaseValue[i]) {
							packets.push({
								type: 'update',
								index: i,
								data: filterObject(newBaseValue[i], serverView.view.parser.isKeyAllowed, baseValue[i]),
							});
						}
					}
					break;
				default:
					for (let i = 0, j = 0; i < baseValue.length || j < newBaseValue.length; i++, j++) {
						if (baseValue[i] !== newBaseValue[j]) {
							if (baseValue[i + 1] === newBaseValue[j] || newBaseValue[j] === undefined) {
								// delete
								if (j < newBaseValue.length) {
									packets.push({
										type: 'delete',
										index: j,
									});
								}
								j--;
							} else if (baseValue[i] === newBaseValue[j + 1] || baseValue[i] === undefined) {
								packets.push({
									type: 'insert',
									index: j,
									data: serverView.view.parser.format(newBaseValue[j]),
								});
								i--;
							} else if (newBaseValue[j] !== undefined || baseValue[i] !== undefined) {
								packets.push({
									type: 'update',
									index: j,
									data: filterObject(newBaseValue[j], serverView.view.parser.isKeyAllowed, baseValue[i]),
								});
							}
						}
					}
			}
			if (gaveUp) {
				packets.length = 0;
				packets.push({
					type: 'replace',
					data: baseValue.map(serverView.view.parser.format),
				});
			}
			baseValue = newBaseValue;
		}
	},
};


function attachFollower<V extends AnyView>(view: Omit<ServerView<V>, 'makeFollower'>): ServerView<V> {
	return {
		makeFollower(initState, permissions, args) {
			const creator = followerMap[view.view.type] as <V extends AnyView>(serverView: Omit<ServerView<V>, 'makeFollower'>, initState: State, args: ViewArgs<V>) => Follower;
			return creator(view, initState, args);
		},
		...view,
	};
}

function makeServerView<V extends AnyView>(view: V, options: Omit<ServerView<V>, 'view' | 'makeFollower'>): ServerView<V> {
	return attachFollower({
		view,
		...options,
	});
}
function makeServerViews<V extends Record<string, AnyView>>(views: V, options: {[K in keyof V]: Omit<ServerView<V[K]>, 'view' | 'makeFollower'>}): { [K in keyof V]: ServerView<V[K]> } {
	return Object.fromEntries(Object.entries(views).map(([key, view]) => [key, makeServerView(view, options[key])])) as { [K in keyof V]: ServerView<V[K]> };
}

function listActionMap(module: ModuleKeys): ActionMap<[]> {
	return {
		init: true,
		delete(a) {
			return a.module === module;
		},
		update(a) {
			return a.module === module;
		},
		persist(a) {
			return a.module === module;
		},
		// Ignore concat here, this field is typially not important in the overview
	};
}

function singleActionMap(module: ModuleKeys): ActionMap<[string]> {
	return {
		init: true,
		delete(a, id) {
			return a.module === module && a.payload === id;
		},
		update(a, id) {
			return a.module === module && a.payload.id === id;
		},
		concat(a, id) {
			return a.module === module && a.payload.id === id;
		},
		// Skip persist, as we have no way of knowing swhich field contains the key, let alone which computed entity
	};
}
const nullImplementation = {
	select() {
		return null;
	},
	updateMap: {},
};

function makeGetView<K extends keyof typeof getIdFromEntity>(module: K) {
	return {
		select(state: State, [id]: [string]): Parameters<(typeof getIdFromEntity)[K]>[0] | null {
			return getOrNull(state as any, module, id as any);
		},
		updateMap: singleActionMap('task'),
	};
}

const serverViews = makeServerViews(views, {
	deploymentGet: makeGetView('deployment'),
	deploymentInformationGet: makeGetView('deploymentInformation'),
	taskInformationGet: makeGetView('taskInformation'),
	repoGet: makeGetView('repo'),
	siteGet: makeGetView('site'),
	taskGet: makeGetView('task'),

	taskList: {
		select(state) {
			return allValues(state, 'task');
		},
		updateMap: listActionMap('task'),
	},
	taskListPerDeplyoment: {
		select(state, [id]) {
			return filter(state, 'task', (e) => e.deploymentId === id);
		},
		updateMap: listActionMap('task'),
	},
	taskListPerRepo: nullImplementation,
	taskListPerSite: nullImplementation,
});

export default serverViews;
