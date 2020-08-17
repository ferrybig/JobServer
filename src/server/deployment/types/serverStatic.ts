import { DeploymentService } from '../deploymentService';
import location from '../nginxConfig';
import { join, resolve, sep } from 'path';
import runCommand from '../../../common/async/runCommand';
import { mkdir, access } from '../../../common/async/fs';

const deployment: DeploymentService = {
	async preStart(data) {
		// Copy files to new dir
		const output = join(data.taskInformation.deploymentDir, `${data.deployment.sequenceId}`);
		await mkdir(output, { recursive: true });
		await runCommand('tar', ['-xf', resolve(data.task.outputFile)], { cwd: output });
	},
	start() {
		// Do nothing
		return Promise.resolve();
	},
	stop() {
		// Do nothing
		return Promise.resolve();
	},
	async afterStop(data) {
		// Delete old files
		const output = join( data.taskInformation.deploymentDir, `${data.deployment.sequenceId}`);

		await runCommand('rm', ['-r', output], {});
	},
	async checkStatus(data) {
		// We don't have a stop task, eithe return mising or prepared
		const output = join(data.taskInformation.deploymentDir, `${data.deployment.sequenceId}`);
		try {
			await access(output);
			return 'prepared';
		} catch(_) {
			return 'missing';
		}
	},
	generateConfigBlob(data, site) {
		const deploymentDir = resolve(data.taskInformation.deploymentDir);
		// Use `root` and other parts in the config
		return location('', data.taskInformation.sitePath, l => {
			if (data.taskInformation.sitePath === '/') {
				l.root(join(deploymentDir, `${data.deployment.sequenceId}`) + sep);
			} else {
				l.alias(join(deploymentDir, `${data.deployment.sequenceId}`) + sep);
			}
			l.gzip('on');
			l.gzipStatic('on');
			for (const line of data.taskInformation.deploymentInstructions.split('\n')) {
				switch (line) {
					case '':
						// Do nothing
						break;
					case 'autoindex':
						l.autoindex('on');
						break;
					case 'spa':
						l.tryFiles('$url', 'index.html', '=404');
						break;
					default:
						l.comment('Unknown option ' + line);
				}
			}
		});
	}
};
export default deployment;
