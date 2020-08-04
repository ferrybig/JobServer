import { NetworkEntity, task } from './types';

type Form = keyof NetworkEntity<any, any, any>['examples'];

export interface View<O extends NetworkEntity<any, any, any>, F extends Form = Form, T extends 'list' | 'single' = 'list' | 'single', A extends string[] = []> {
	entityData: O;
	form: F;
	type: T;
	argsHandler: (...args: A) => A;
}

const DEFAULT_ARG_HANDLER = <T extends string[]>(...args: T): T => args;
const args = <A extends string[]>(): (...args: A) => A => DEFAULT_ARG_HANDLER;

function makeView<
	O extends NetworkEntity<any, any, any>,
	F extends Form,
	T extends 'list' | 'single',
	A extends string[] = []
>(entityData: O, form: F, type: T, argsHandler: (...args: A) => A): View<O, F, T, A> {
	return {
		entityData,
		form,
		type,
		argsHandler,
	};
}

export type DataForView<V extends View<any>> =
	V['type'] extends 'list' ? V['entityData']['examples'][V['form']][] :
	V['type'] extends 'single' ? V['entityData']['examples'][V['form']] :
	never;
export type AllDataForView<V extends View<any>> =
	V['type'] extends 'list' ? V['entityData']['examples']['all'][] :
	V['type'] extends 'single' ? V['entityData']['examples']['all'] :
	never;

export const taskGet = makeView(task, 'full', 'single', args<[string]>());
export const taskList = makeView(task, 'short', 'list', args<[]>());
//export const taskByRepo = makeView(task, 'short', 'list', args<[string]>());
export const taskByDeploymentId = makeView(task, 'short', 'list', args<[string]>());
