import {DeploymentService} from "../deploymentService";
import location from "../nginxConfig";
import {join} from "path";
import runCommand from "../../../common/async/runCommand";
import {mkdir} from "../../../common/async/fs";

const deployment: DeploymentService = {
	async preStart(data) {
		const deploymentDir = data.taskInformation.deploymentDir
		// Copy files to new dir
		const output = join(deploymentDir, `${data.deployment.sequenceId}`);
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
		const deploymentDir = data.taskInformation.deploymentDir

		const output = join(deploymentDir, `${data.deployment.sequenceId}`);

		await runCommand('rm', ['-r', data.task.outputFile], {cwd: output});
	},
	checkStatus() {
		// We don't have a stop task, eithe return mising or prepared
		return Promise.resolve('missing'); // TODO
	},
	generateConfigBlob(data, path, site) {
		const deploymentDir = data.taskInformation.deploymentDir;
		// Use `root` and other parts in the config
		return Promise.resolve(location('', path, l => {
			l.root(join(deploymentDir, `${data.deployment.sequenceId}`));
		}));
	}
}
export default deployment;