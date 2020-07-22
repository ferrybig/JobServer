import { take as sagaTake, TakeEffect } from 'redux-saga/effects';
import {Channel, EventChannel} from 'redux-saga';
import {AnyAction} from 'redux';

type FilterObject = { type: string } | string
type FilterArray = FilterObject[]
type BaseTypes = FilterObject | Channel<any> | EventChannel<any> | ((action: AnyAction) => boolean);
function isActionCreator<T>(filter: BaseTypes): filter is { type: string } {
	return 'type' in (filter as any);
}
function mapFilter(filter: FilterObject): string {
	return isActionCreator(filter) ? filter.type : filter;
}
export function take(filter: FilterArray | BaseTypes): TakeEffect {
	const reduxFriendlyList =
		Array.isArray(filter) ? filter.map(mapFilter) :
		isActionCreator(filter) ? filter.type :
		filter;
	return sagaTake(reduxFriendlyList as unknown as string);
}


export function takeFiltered<
	K extends string, V, A extends {type: string, (...args: any): { type: string, payload: Record<K, V> }},
>(
	actions: A[], key: K, value: V
): TakeEffect {
	const map: Record<string, true> = {};
	for(const action of actions) {
		map[action.type] = true;
	}
	function isMatchedAction(action: AnyAction): action is ReturnType<A> {
		return map[action.type];
	}
	return sagaTake((action: AnyAction): boolean => {
		if (!isMatchedAction(action)) {
			return false;
		}
		const actionValue = action.payload[key];
		return Object.is(actionValue, value);
	});
}