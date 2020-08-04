import * as views from '../../../common/views';
import { State } from '../../store/reducer';
import { getOrNull, allValues, filter } from '../../store/selectors';
import * as actions from '../../store/actions';
import Values from '../../../common/utils/Values';
import { ModuleKeys } from '../../store/crud';
import { EntityDataPacket, SubscriptionSingleChangeData, SubscriptionListChangeData } from '../../../common/packets/clientPackets';
import { NetworkEntity } from '../../../common/views/types';
import assertNever from '../../../common/utils/assertNever';
import pick from '../../../common/utils/pick';
import { referenceEquals, shallowEquals, genericShallowEquals } from '../../../common/utils/equals';

type ActionMap<P extends any[], A extends { type: string, (...args: any): any } = Values<typeof actions>> = {
	[K in A['type']]?: true | ((action: ReturnType<Extract<A, { type: K }>>, ...args: P) => boolean)
}

type AllActions = ReturnType<Values<typeof actions>>;

export type Follower = Iterator<EntityDataPacket['data'][], void, [State, AllActions]>;

type ServerView<V extends views.View<any, any, any, any>> = {
	select: (state: State, options: Parameters<V['argsHandler']>) => views.AllDataForView<V> | null;
	entityData: V['entityData'],
	form: V['form'],
	type: V['type'],
	updateMap: ActionMap<Parameters<V['argsHandler']>>,
	makeFollower(initState: State, permissions: Record<string, boolean>, options: Parameters<V['argsHandler']>): Follower
}

type WriteOnlyArray<T> = {
	push(data: T): void;
}

function filterByNetworkEntity(keys: string[] | null, input: any): any {
	if (keys === null) {
		return input;
	}
	if (Array.isArray(input)) {
		return input.map(e => pick(e, keys));
	}
	return pick(input, keys);
}

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

function compareEquality<T>(a: T, b: T, shallow: boolean): boolean {
	if (Array.isArray(a)) {
		if (shallow) {
			return genericShallowEquals(a, b, shallowEquals);
		} else {
			return genericShallowEquals(a, b, referenceEquals);
		}
	} else {
		if (shallow) {
			return shallowEquals(a, b);
		} else {
			return referenceEquals(a, b);
		}
	}
}

function makePacketsForSingle<T extends object>(initialValue: T, newValue: T, action: AllActions, packets: WriteOnlyArray<SubscriptionSingleChangeData>) {
	const allowedKeys: Partial<Record<string, true>> = Object.fromEntries(Object.keys(initialValue).map(e => [e, true]));
	switch (action.type) {
	case 'update':
		packets.push({
			type: 'update',
			data: newValue,
		});
		break;
	case 'concat':
		if (allowedKeys[action.payload.field]) {
			packets.push({
				type: 'concat',
				data: action.payload,
			});
		}
		break;
	default:
		const changes: Partial<Record<keyof T, any>> = {};
		for (const [key, value] of Object.entries(initialValue)) {
			const bValue = newValue[key as keyof T];
			if (value !== bValue) {
				changes[key as keyof T] = bValue;
			}
		}
		packets.push({
			type: 'update',
			data: changes,
		});
		break;
	}
}
function makePacketsForList<T extends object>(initialValue: T[], newValue: T[], action: AllActions, packets: WriteOnlyArray<SubscriptionListChangeData>) {
	const difference = initialValue.length - newValue.length;
	if (difference !== 0 || initialValue[0] !== newValue[0]) {
		packets.push({
			type: 'replace',
			data: newValue,
		});
		return;
	}
	if (action.type === 'update') {
		let hasSend = false;
		for (let i = 0; i < initialValue.length; i++) {
			if (initialValue[i] !== newValue[i]) {
				hasSend = true;
				packets.push({
					type: 'update',
					index: i,
					data: newValue[i],
				});
			}
		}
		if (hasSend) {
			return;
		}
	}
	packets.push({
		type: 'replace',
		data: newValue,
	});
	return;
}
function makePackets(view: Pick<views.View<NetworkEntity<any, any, any>>, 'type'>, initialValue: any, newValue: any, action: AllActions, packets: EntityDataPacket['data'][]) {
	switch (view.type) {
	case 'single':
		return makePacketsForSingle(initialValue, newValue, action, packets);
	case 'list':
		return makePacketsForList(initialValue, newValue, action, packets);
	default:
		return assertNever(view.type);
	}
}

function attachFollower<V extends views.View<NetworkEntity<any, any, any>>>(view: Omit<ServerView<V>, 'makeFollower'>): ServerView<V> {
	return {
		*makeFollower(initState, permissions, args) {
			const form: views.View<any>['form'] = view.form;
			const usedKeys =
				form === 'all' ? null :
				form === 'full' ? view.entityData.fullKeys :
				form === 'short' ? view.entityData.shortKeys :
				assertNever(form);
			let baseValue = view.select(initState, args);
			let filteredBaseValue = filterByNetworkEntity(usedKeys, baseValue);
			const packets: EntityDataPacket['data'][] = [{
				type: 'replace',
				data: filteredBaseValue,
			}];
			while (true) {
				const [state, action] = yield packets;
				packets.length = 0;
				const filterStatus = executeFilter(view.updateMap, action, args);
				if (!filterStatus) {
					continue;
				}
				const newBaseValue = view.select(state, args);
				if (newBaseValue === null) {
					return;
				}
				if (compareEquality(baseValue, newBaseValue, false)) {
					// Our update map lied to us! No changes have been applied to the store in our interests. Glad we checked it
					continue;
				}
				baseValue = newBaseValue;
				const newFilteredBaseValue = filterByNetworkEntity(usedKeys, newBaseValue);
				if (compareEquality(filteredBaseValue, newFilteredBaseValue, true)) {
					// After filtering away the bad keys, we have no changes. Don't do anything.
					continue;
				}
				makePackets(view, filteredBaseValue, newFilteredBaseValue, action, packets);
				filteredBaseValue = newFilteredBaseValue;
			}
		},
		...view,
	};
}

function makeServerView<V extends views.View<any, any, any, any>>(view: V, options: Omit<ServerView<V>, 'type' | 'form'  | 'entityData' | 'makeFollower'>): ServerView<V> {
	return attachFollower({
		form: view.form,
		type: view.type,
		entityData: view.entityData,
		...options,
	});
}
function makeServerViews<V extends Record<string, views.View<any, any, any, any>>>(views: V, options: {[K in keyof V]: Omit<ServerView<V[K]>, 'type' | 'form'  | 'entityData' | 'makeFollower'>}): { [K in keyof V]: ServerView<V[K]> } {
	return Object.fromEntries(Object.entries(views).map(([key, value]) => [key, makeServerView(value, options[key])])) as { [K in keyof V]: ServerView<V[K]> };
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

const serverViews = makeServerViews(views, {
	taskGet: {
		select(state, [id]) {
			return getOrNull(state, 'task', id);
		},
		updateMap: singleActionMap('task'),
	},
	taskList: {
		select(state) {
			return allValues(state, 'task');
		},
		updateMap: listActionMap('task'),
	},
	taskByDeploymentId: {
		select(state, [id]) {
			return filter(state, 'task', (e) => e.deploymentId === id);
		},
		updateMap: listActionMap('task'),
	},
});

export default serverViews;
