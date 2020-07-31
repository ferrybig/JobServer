import {DeploymentChangeSet} from "./deploymentService";
import {autoDeploymentService} from ".";
import {State} from "../store/reducer";
import {get, allKeys} from "../store/selectors";
import {Site, NginxConfig} from "../store/types";
import {SSL_NGINX_PORT, NOSSL_NGINX_PORT, NGINX_CONFIG_PATH, NGINX_CONFIG_CHECK, NGINX_RELOAD, NGINX_RESTART} from "../config";
import {writeFile, access, unlink, rename} from "../../common/async/fs";
import assertNever from "../../common/utils/assertNever";
import runCommand from "../../common/async/runCommand";

const NGINX_CONFIG_PATH_NEW = NGINX_CONFIG_PATH + '.new';
const NGINX_CONFIG_PATH_BAK = NGINX_CONFIG_PATH + '.bak';
const NGINX_CONFIG_PATH_TEST = NGINX_CONFIG_PATH + '.test';


interface SimpleAbortSignal {
	aborted: boolean;
}

async function tryAllOrDeconstructLoop<T, R>(array: T[], callback: {
	onInit(value: T, index: number, list: T[]): Promise<void>
	inner(): Promise<R>
	onDestroy(value: T, index: number, list: T[]): Promise<void>
}, onSuppressedError: (error: Error) => void = (e) => console.warn(e)): Promise<R> {
	if (array.length === 0) {
		return callback.inner();
	}
	let index = 0;
	try {
		for (; index < array.length; index++) {
			await callback.onInit(array[index], index, array);
		}
		return callback.inner();
	} catch(e) {
		for(index = index - 1; index >= 0; index--) {
			try {
				await callback.onDestroy(array[index], index, array);
			} catch(e) {
				onSuppressedError(e);
			}
		}
		throw e;
	}
}

function writeConfigFor(state: Pick<State, 'nginxConfig'>, topic: Site | NginxConfig): string {
	let config = `# Start ${topic.name}\n`
	config += topic.includesBefore ? writeConfigFor(state, get(state, 'nginxConfig', topic.includesBefore)) : '';
	config += topic.configBlob ? `${topic.configBlob}\n` : '';
	config += topic.includesAfter ? writeConfigFor(state, get(state, 'nginxConfig', topic.includesAfter)) : '';
	config += `# End ${topic.name}\n`
	return config

}

function indent(main: string, indent: number | string) {
	const finalIndent = typeof indent === 'number' ? '\t'.repeat(indent) : indent;
	if (main.length === 0) {
		return '';
	}
	const split = main.split('\n');
	return split.map((e, i) => i === split.length - 1 ? e : finalIndent + e).join('\n');
}

interface Options {
	abortSignal?: SimpleAbortSignal,
	logger?: (log: string) => void;
	warnings?: (error: Error) => void;
}
type OptionsAllRequired = {
	[K in keyof Options]-?: NonNullable<Options[K]>;
}

export default class DeploymentRunner {
	public constructor() {}

	public run(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: Options = {}): Promise<void> {
		const abortSignal = options.abortSignal || { aborted: false };
		const logger = options.logger || (() => {});
		const warnings = options.warnings || (() => {});
		if (abortSignal.aborted) {
			throw new Error('Aborted');
		}
		// Prepare new tasks
		// -> If error, goto abort-unprepare
		// Create config and check for syntax errors
		// -> If error, goto abort-unprepare
		// Stop old tasks
		// -> If error, goto abort-unstop
		// Start new tasks
		// -> If error, goto abort-unstart
		// Swap NGINX config files, and reload nginx
		// -> If error, ignore, we should have caught this in the config check stage before
		// Post-stop old tasks
		// -> If error, ignore, but emit warning
		////////

		// Prepare new tasks
		return this.prepareTasks(changes, state, {
			abortSignal,
			logger,
			warnings,
		});
	}

	private prepareTasks(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired): Promise<void> {
		options.logger('# prepareTasks\n');
		return tryAllOrDeconstructLoop(changes.toCreate, {
			onInit: (t, i) => {
				options.logger(`[${i}: ${t.taskInformation.name}] preStart`);
				return autoDeploymentService.preStart(t, { logger: options.logger });
			},
			inner: () => this.generateNewConfigAndCheck(changes, state, options),
			onDestroy: (t, i) => {
				options.logger(`[${i}] afterStop`);
				return autoDeploymentService.afterStop(t, { logger: options.logger });
			},
		}, options.warnings)
	}

	private async generateNewConfigAndCheck(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired): Promise<void> {
		options.logger('# generateNewConfigAndCheck\n');
		if (options.abortSignal.aborted) {
			throw new Error('Aborted');
		}
		const configs: Record<Site['id'], string | undefined> = {};
		for (const deployment of changes.newSituation) {
			const siteId = deployment.taskInformation.siteId;
			if (siteId) {
				options.logger(`[${deployment.taskInformation.name}] generateConfigBlob`);
				const config = `# ${deployment.taskInformation.name}\n` + await autoDeploymentService.generateConfigBlob(deployment, get(state, 'site', deployment.taskInformation.siteId));
				configs[siteId] = (configs[siteId] || '') + config;
			}
		}
		let config = '';
		for (const siteId of allKeys(state, 'site')) {
			const site = get(state, 'site', siteId);
			if (site.ssl !== 'no') {
				config += `# Site ${site.name} (SSL)\n`;
				config += 'server {\n';
				config += `\tserver_name ${[site.name, ...site.aliasses].join(' ')};\n`;
				config += `\tlisten [::]:${SSL_NGINX_PORT} ${site.default ? 'default_server' : ''} ipv6only=off ssl http2;\n`;
				config += indent(writeConfigFor(state, site), '\t');
				config += indent(configs[siteId] || '', '\t');
				config += '}\n';
			}
			if (site.noSsl !== 'no') {
				config += `# Site ${site.name} (NO SSL)\n`;
				config += 'server {\n';
				config += `\tserver_name ${[site.name, ...site.aliasses].join(' ')};\n`;
				config += `\tlisten [::]:${NOSSL_NGINX_PORT} ${site.default ? 'default_server' : ''} ipv6only=off;\n`;
				config += indent(writeConfigFor(state, site), '\t');
				if (site.noSsl === 'redirect') {
					config += '\treturn 301 https://$host$request_uri;\n';
				} else if (site.noSsl === 'yes') {
					config += indent(configs[siteId] || '', '\t');
				} else {
					return assertNever(site.noSsl);
				}
				config += '}\n';
			}
		}
		await writeFile(NGINX_CONFIG_PATH_NEW, config, 'utf-8');
		return this.configCheck(changes, state, options);
	}

	private async configCheck(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired) {
		options.logger('# configCheck\n');
		if (options.abortSignal.aborted) {
			throw new Error('Aborted');
		}
		let testConfig = '';
		testConfig += 'error_log /tmp/123456.log debug;\n'
		testConfig += 'daemon off;\n'
		testConfig += 'pid /tmp/123456.pid;\n'
		testConfig += 'events {\n'
		testConfig += '}\n'
		testConfig += 'http {\n';
		testConfig += '\terror_log /tmp/123456.log debug;\n'
		testConfig += '\taccess_log /tmp/123456.log;\n'
		testConfig += '\tinclude ' + NGINX_CONFIG_PATH_NEW + ';\n';
		testConfig += '}\n';
		await writeFile(NGINX_CONFIG_PATH_TEST, testConfig, 'utf-8');
		await runCommand('sh', ['-c', NGINX_CONFIG_CHECK, 'configCheck.sh', NGINX_CONFIG_PATH_TEST], {logger: options.logger });
		return this.stopOldTasks(changes, state, options);
	}

	private stopOldTasks(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired): Promise<void> {
		options.logger('# stopOldTasks\n');
		if (options.abortSignal.aborted) {
			throw new Error('Aborted');
		}
		return tryAllOrDeconstructLoop(changes.toDelete, {
			onInit: (t, i) => {
				options.logger(`[${i}: ${t.taskInformation.name}] stop`);
				return autoDeploymentService.stop(t, { logger: options.logger });
			},
			inner: () => this.startNewTasks(changes, state, options),
			onDestroy: (t, i) => {
				options.logger(`[${i}] start`);
				return autoDeploymentService.start(t, { logger: options.logger });
			},
		}, options.warnings);
	}

	private startNewTasks(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired): Promise<void> {
		options.logger('# startNewTasks\n');
		return tryAllOrDeconstructLoop(changes.toCreate, {
			onInit: (t, i) => {
				options.logger(`[${i}: ${t.taskInformation.name}] start`);
				return autoDeploymentService.start(t, { logger: options.logger });
			},
			inner: () => this.reloadNginx(changes, state, options),
			onDestroy: (t, i) => {
				options.logger(`[${i}] stop`);
				return autoDeploymentService.stop(t, { logger: options.logger });
			},
		}, options.warnings);
	}

	private async reloadNginx(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired): Promise<void> {
		options.logger('# reloadNginx\n');
		try {
			await unlink(NGINX_CONFIG_PATH_BAK);
		} catch(e) {
			options.warnings(e);
		}
		try {
			await rename(NGINX_CONFIG_PATH, NGINX_CONFIG_PATH_BAK);
		} catch(e) {
			options.warnings(e);
		}
		await rename(NGINX_CONFIG_PATH_NEW, NGINX_CONFIG_PATH);

		try {
			await runCommand('sh', ['-c', NGINX_RELOAD, 'nginxReload.sh'], {logger: options.logger });
		} catch(e) {
			options.warnings(e);
			try {
				await runCommand('sh', ['-c', NGINX_RESTART, 'nginxStart.sh'], {logger: options.logger });
			} catch(e) {
				options.warnings(e);
			}
		}
		return this.cleanupOldTasks(changes, state, options);
	}

	private async cleanupOldTasks(changes: DeploymentChangeSet, state: Pick<State, 'site' | 'nginxConfig'>, options: OptionsAllRequired): Promise<void> {
		options.logger('# cleanupOldTasks\n');
		for (let i = 0; i < changes.toDelete.length; i++) {
			const t = changes.toDelete[i];
			options.logger(`[${i}: ${t.taskInformation.name}] afterStop`);
			try {
				await autoDeploymentService.afterStop(t, { logger: options.logger });
			} catch(e){
				options.warnings(e);
			}
		}
	}
}
