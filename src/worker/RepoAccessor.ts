import KeyedLock from "../common/utils/KeyedLock";
import { join } from 'path';
import { access } from "../common/async/fs";
import runCommand from "../common/async/runCommand";
import { RepoDescription } from "../common/types";

interface Options {
	logger?: (message: string) => void;
}

export default class RepoAccessor {
	private cachedReposLocation: string;
	private lock: KeyedLock = new KeyedLock();
	public constructor(cachedReposLocation: string) {
		this.cachedReposLocation = cachedReposLocation;
	}

	public async useRepoDescription<T>(
		{ url, commit, branch }: RepoDescription,
		callback: (directory: string) => Promise<T>,
		{ logger }: Options = {}
	): Promise<T> {
		const hash = url.replace(/[^a-zA-Z0-9]+/g, "-");
		const unlock = await this.lock.lock(hash);
		const cwd = join(this.cachedReposLocation, hash);
		if (logger) {
			logger('Checking out files to ' + cwd + '\n');
		}
		try {
			let success = false;
			try {
				await access(cwd);
				success = true;
				await runCommand('git', ['fetch', '--all'], { cwd, logger });
			} catch(e) {
				if (success) {
					throw e;
				}
				await runCommand('git', ['clone', url, cwd], { logger });
			}
			if (branch) {
				await runCommand('git', ['checkout', branch.startsWith('ref/heads/') ? branch.substring('ref/heads/'.length) : branch], { cwd, logger });
				if (commit) {
					await runCommand('git', ['reset', '--hard', commit], { cwd, logger });
				} else {
					await runCommand('git', ['reset', '--hard', 'origin/' + branch], { cwd, logger });
				}
			} else {
				if (commit) {
					await runCommand('git', ['checkout', commit], { cwd, logger });
				} else {
					await runCommand('git', ['reset', '--hard', 'origin/HEAD'], { cwd, logger });
				}
			}
			return await callback(cwd);
		} finally {
			unlock();
		}
	}
}
