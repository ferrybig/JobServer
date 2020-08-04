import tmp, { FileOptions } from 'tmp';

export function tmpFile(opt?: FileOptions): Promise<[() => void, string]> {
	return new Promise((resolve, reject) => {
		tmp.file({ discardDescriptor: true, ...opt }, function _tempFileCreated(err, path, fd, cleanupCallback) {
			if (err) {
				return reject(err);
			}
			// fd will be undefined, allowing application to use fs.createReadStream(path)
			// without holding an unused descriptor open.
			resolve([cleanupCallback, path]);
		});
	});
}

export async function tmpFileBlock<T>(func: (file: string) => Promise<T> | T, opt?: FileOptions): Promise<T> {
	const [closeTmp, tmp] = await tmpFile(opt);
	try {
		return func(tmp);
	} finally {
		closeTmp();
	}
}

export function tmpDir(): Promise<[() => void, string]> {
	return new Promise((resolve, reject) => {
		tmp.dir({ }, function _tempDirCreated(err, path, cleanupCallback) {
			if (err) {
				return reject(err);
			}
			// fd will be undefined, allowing application to use fs.createReadStream(path)
			// without holding an unused descriptor open.
			resolve([cleanupCallback, path]);
		});
	});
}
