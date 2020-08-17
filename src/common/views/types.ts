import { Task, Repo, Deployment, DeploymentInformation, TaskInformation, Site } from '../types';
import pick from '../utils/pick';

type Form = 'short' | 'full' | 'all';


type SubType<M extends object, F extends Form, T extends object> = {
	format: (input: M) => T & { _form: F };
	formatPartial: (input: Partial<M>) => Partial<T> & { _form: F };
	isKeyAllowed: (key: PropertyKey) => boolean;
}

type Factory<T extends object> = <K1 extends keyof T, K2 extends K1>(full: K1[], short: K2[]) => {
	short: SubType<T, 'short', Pick<T, K2>>;
	full: SubType<T, 'full', Pick<T, K1>>;
	all: SubType<T, 'all', T>;
}

function makeSubtypeFunction<M extends object, F extends Form, K extends (keyof M)[] | null>(form: F, keys: K): SubType<M, F, K extends keyof M ? Pick<M, K> : M> {
	return {
		format: (val): (K extends keyof M ? Pick<M, K> : M) & { _form: F } => {
			if (keys === null) {
				return {
					_form: form,
					...val,
				} as unknown as (K extends keyof M ? Pick<M, K> : M) & { _form: F };
			}
			return pick(val, keys as (keyof M)[], {
				_form: form,
			}) as (K extends keyof M ? Pick<M, K> : M) & { _form: F };
		},
		formatPartial: (val): (K extends keyof M ? Pick<M, K> : M) & { _form: F } => {
			if (keys === null) {
				return {
					_form: form,
					...val,
				} as unknown as (K extends keyof M ? Pick<M, K> : M) & { _form: F };
			}
			return pick(val, keys as (keyof M)[], {
				_form: form,
			}) as (K extends keyof M ? Pick<M, K> : M) & { _form: F };
		},
		isKeyAllowed(key) {
			return keys === null || keys.includes(key as keyof M);
		},
	};
}

function makeTypeDefinition<T extends object>(): Factory<T> {
	return <K1 extends keyof T, K2 extends K1>(full: K1[], short: K2[]): {
		short: SubType<T, 'short', Pick<T, K2>>;
		full: SubType<T, 'full', Pick<T, K1>>;
		all: SubType<T, 'all', T>;
	} => ({
		short: makeSubtypeFunction('short', short) as SubType<T, 'short', Pick<T, K2>>,
		full: makeSubtypeFunction('full', full) as SubType<T, 'full', Pick<T, K1>>,
		all: makeSubtypeFunction('all', null) as SubType<T, 'all', T>,
	});
}

export type ReturnedValue<S extends SubType<any, any, any>> = ReturnType<S['format']>;
export type ReturnedValueOrMore<S extends SubType<any, any, any>> = Omit<ReturnedValue<S>, '_form'>;

export const {
	short: taskShort,
	full: taskFull,
	all: taskAll,
} = makeTypeDefinition<Task>()(
	['id', 'workerId', 'status', 'log', 'taskInformationId', 'deploymentId', 'startTime', 'buildTime', 'endTime'],
	['id', 'status', 'taskInformationId', 'deploymentId', 'startTime', 'buildTime', 'endTime'],
);

export const {
	short: repoShort,
	full: repoFull,
	all: repoAll,
} = makeTypeDefinition<Repo>()(
	['id', 'url'],
	['id', 'url'],
);

export const {
	short: deploymentShort,
	full: deploymentFull,
	all: deploymentAll,
} = makeTypeDefinition<Deployment>()(
	['id', 'commit', 'branch', 'status', 'deploymentInformationId', 'timestamp', 'sequenceId', 'deployed'],
	['id', 'commit', 'branch', 'status', 'deploymentInformationId', 'timestamp', 'sequenceId', 'deployed'],
);

export const {
	short: deploymentInformationShort,
	full: deploymentInformationFull,
	all: deploymentInformationAll,
} = makeTypeDefinition<DeploymentInformation>()(
	['id', 'name', 'pattern', 'repoId'],
	['id', 'name', 'pattern', 'repoId'],
);

export const {
	short: taskInformationShort,
	full: taskInformationFull,
	all: taskInformationAll,
} = makeTypeDefinition<TaskInformation>()(
	['id', 'name', 'buildScript', 'buildScriptType', 'deploymentInformationId', 'sequenceId', 'deploymentType', 'sitePath', 'siteId'],
	['id', 'name', 'sequenceId', 'sitePath', 'siteId'],
);

export const {
	short: siteShort,
	full: siteFull,
	all: siteAll,
} = makeTypeDefinition<Site>()(
	['id', 'name', 'configBlob', 'aliasses', 'ssl', 'noSsl', 'default'],
	['id', 'name', 'aliasses', 'default'],
);

