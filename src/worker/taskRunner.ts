import { BuildTask } from '../common/types';
import { tmpFileBlock } from '../common/async/tmp';
import { writeFile, readdir, readFile } from '../common/async/fs';
import runCommand from '../common/async/runCommand';
import RepoAccessor from './RepoAccessor';


function buildScriptToDockerFile(buildScript: string[]) {
	return buildScript.join('\n');
}

export default class TaskRunner {
	private repoAccessor: RepoAccessor;

	constructor(repoAccessor: RepoAccessor) {
		this.repoAccessor = repoAccessor;
	}

	async run(task: BuildTask, outputFile: string, logger?: (ouput: string) => void) {
		await tmpFileBlock(async (tmp) => {
			//await writeFile(tmp, buildScriptToDockerFile(task.buildScript));
			await this.repoAccessor.useRepoDescription(task.repo, async (inputFiles) => {
				const files = await readdir(inputFiles);
				let ignoreFile = '';
				try {
					ignoreFile = await readFile(inputFiles + '/.dockerignore', 'utf-8');
				} catch(_) {}
				await tmpFileBlock(async(tmp1) => {
					await tmpFileBlock(async(tmp2) => {
						await writeFile(tmp1, buildScriptToDockerFile(task.buildScript));
						await writeFile(tmp2, ignoreFile + '\nDockerfile\n');
						await runCommand('tar', [
							'-czf',
							tmp,
							'--transform',
							's/' + tmp1.substring(1).replace(/\//g, '\\/') + '/Dockerfile/',
							'--transform',
							's/' + tmp2.substring(1).replace(/\//g, '\\/') + '/.dockerignore/',
							'--',
							...files,
							tmp1,
							tmp2,
						], {
							cwd: inputFiles,
							logger,
						});
					});
				});
			}, { logger });
			await runCommand('env', [
				'DOCKER_BUILDKIT=1',
				'docker',
				'build',
				'--output',
				'type=tar,dest=' + outputFile,
				'-'
			], {
				logger,
				stdin: tmp,
			});
		}, { postfix: '.tar.gz' });

	}
}
