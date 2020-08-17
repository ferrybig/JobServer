import * as types from './types';
import { SubscriptionListChangeData, SubscriptionSingleChangeData } from '../packets/clientPackets';

type TypeMethod<I, O> = {
	format(input: I): O;
	formatPartial(input: Partial<I>): Partial<O>;
	isKeyAllowed(key: PropertyKey): boolean;
}

export interface View<T extends 'single' | 'list', I extends object, O extends object, A extends string[]> {
	type: T,
	parser: TypeMethod<I, O>,
	argsValidator: (args: string[]) => args is A;
}
export type AnyView = View<'single' | 'list', object, object, string[]>;

export type ViewType<V extends AnyView> = V extends View<infer R, any, any, any> ? R : never;
export type ViewInput<V extends AnyView> = V extends View<any, infer R, any, any> ? R : never;
export type ViewOutput<V extends AnyView> = V extends View<any, any, infer R, any> ? R : never;
export type ViewArgs<V extends AnyView> = V extends View<any, any, any, infer R> ? R : never;

export type PacketsForView<V extends AnyView> =
	V['type'] extends 'single' ? SubscriptionSingleChangeData<ViewOutput<V>> :
	V['type'] extends 'list' ? SubscriptionListChangeData<ViewOutput<V>> :
	unknown;
export type InitPacketsForView<V extends AnyView> =
	Extract<PacketsForView<V>, { type: 'replace' }>

export type ClientDataForView<V extends AnyView> =
	V['type'] extends 'single' ? ViewOutput<V> :
	V['type'] extends 'list' ? ViewOutput<V>[] :
	unknown;
export type ServerDataForView<V extends AnyView> =
	V['type'] extends 'single' ? ViewInput<V> :
	V['type'] extends 'list' ? ViewInput<V>[] :
	unknown;

function makeView<T extends 'single' | 'list', I extends object, O extends object, A extends string[]>(viewType: T, type: TypeMethod<I, O>, argsValidator: (args: string[]) => args is A): View<T, I, O, A> {
	return {
		type: viewType,
		parser: type,
		argsValidator,
	};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const arg0 = (args: string[]): args is [] => args.length === 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const arg1 = (args: string[]): args is [string] => args.length === 1;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const arg2 = (args: string[]): args is [string, string] => args.length === 2;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const arg3 = (args: string[]): args is [string, string, string] => args.length === 3;

export const taskGet = makeView('single', types.taskFull, arg1);
export const taskList = makeView('list', types.taskShort, arg0);
export const taskListPerDeplyoment = makeView('list', types.taskShort, arg1);
export const taskListPerRepo = makeView('list', types.taskShort, arg1);
export const taskListPerSite = makeView('list', types.taskShort, arg1);
