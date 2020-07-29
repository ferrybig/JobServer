import {DeploymentService} from "../deploymentService";
import location from "../nginxConfig";
import {join} from "path";
import runCommand from "../../../common/async/runCommand";
import {mkdir, access} from "../../../common/async/fs";

const deployment: DeploymentService = {
	async preStart(data) {
		// Copy files to new dir
		const output = join(data.taskInformation.deploymentDir, `${data.deployment.sequenceId}`);
		await mkdir(output, { recursive: true });
		await runCommand('tar', ['-xf', data.task.outputFile], {cwd: output});
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
	generateConfigBlob(data, path, site) {
		const deploymentDir = data.taskInformation.deploymentDir;
		// Use `root` and other parts in the config
		return location('', path, l => {
			l.root(join(deploymentDir, `${data.deployment.sequenceId}`));
		});
	}
}
export default deployment;