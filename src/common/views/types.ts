import { Repo, Deployment, DeploymentInformation, Task, TaskInformation } from '../types';
import pick from '../utils/pick';

export interface NetworkEntity<B extends object, F extends keyof B, S extends F> {
	examples: {
		all: B;
		full: Pick<B, F>;
		short: Pick<B, S>;
	}
	shortKeys: S[],
	fullKeys: F[],
}

function defineNetworkEntity<B extends object>(): <F extends keyof B, S extends F>(fullKeys: F[], shortkeys: S[], example: B) => NetworkEntity<B, F, S> {
	return <F extends keyof B, S extends F>(fullKeys: F[], shortKeys: S[], example: B): NetworkEntity<B, F, S> => {
		return {
			shortKeys,
			fullKeys,
			examples: {
				all: example,
				full: pick(example, fullKeys),
				short: pick(example, shortKeys),
			},
		};
	};
}

export const repository = defineNetworkEntity<Repo>()(
	['id', 'url'],
	['id', 'url'],
	{
		id: '',
		url: 'git://',
		secret: '',
		outputDir: '',
	}
);
export const deployment = defineNetworkEntity<Deployment>()(
	['id', 'commit', 'branch', 'status', 'deploymentInformationId', 'timestamp', 'sequenceId', 'deployed'],
	['id', 'commit', 'branch', 'status', 'deploymentInformationId', 'timestamp', 'sequenceId', 'deployed'],
	{
		id: '',
		commit: '',
		branch: '',
		outputDir: '',
		status: 'pending',
		deploymentInformationId: '',
		timestamp: 0,
		sequenceId: 0,
		deployed: false,
	}
);
export const deploymentInformation = defineNetworkEntity<DeploymentInformation>()(
	['id', 'name', 'pattern', 'repoId'],
	['id', 'name', 'pattern', 'repoId'],
	{
		id: '',
		name: 'Loading deployment information...',
		pattern: 'refs/heads/.*',
		outputDir: '',
		repoId: '',
		deleted: false,
	}
);
export const task = defineNetworkEntity<Task>()(
	['id', 'workerId', 'status', 'log', 'taskInformationId', 'deploymentId', 'startTime', 'buildTime', 'endTime'],
	['id', 'status', 'taskInformationId', 'deploymentId', 'startTime', 'buildTime'],
	{
		id: '',
		outputFile: null,
		workerId: null,
		status: 'init',
		log: '',
		taskInformationId: '',
		deploymentId: '',
		startTime: 0,
		buildTime: 0,
		endTime: 0,
	}
);
export const taskInformation = defineNetworkEntity<TaskInformation>()(
	['id', 'name', 'buildScript', 'buildScriptType', 'deploymentInformationId', 'sequenceId', 'deploymentType', 'sitePath', 'siteId'],
	['id', 'name', 'sequenceId', 'sitePath', 'siteId'],
	{
		id: '',
		name: 'Example task information',
		buildScript: [],
		buildScriptType: 'docker',
		deploymentInformationId: '',
		sequenceId: 0,
		deploymentDir: '',
		deploymentType: 'static-extract',
		deploymentInstructions: '',
		deleted: false,
		sitePath: '',
		siteId: null,
	}
);

