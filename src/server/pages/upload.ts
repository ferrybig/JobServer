import { Request, Response, NextFunction } from 'express';
import { FileHandle } from 'fs/promises';
import { dirname } from 'path';
import store from '../store/';
import { getOrNull } from '../store/selectors';
import { mkdir, open } from '../../common/async/fs';
import { crudDelete } from '../store/actions';

async function openFile(path: string, offset: number): Promise<FileHandle> {
	const dir = dirname(path);
	await mkdir(dir, { recursive: true });
	const fd = await open(path, 'a');
	try {
		const stat = await fd.stat();
		if (stat.size < offset) {
			throw new Error('File is smaller than the requested offset');
		}
	} catch(e) {
		fd.close();
		throw e;
	}
	return fd;
}

export default function uploadPage(req: Request, res: Response, next: NextFunction) {
	const token = req.params.token;
	let offset = Number(req.headers['x-offset']);
	if (Number.isNaN(offset)) {
		res.statusCode = 400;
		res.send('Missing header: x-offset');
	}
	const file = getOrNull(store.getState(), 'pendingFile', token);
	if (!file) {
		res.statusCode = 404;
		res.send('entity not found');
		return;
	}
	const rootPromise = openFile(file.outputFile, offset);
	let promiseChain = rootPromise;


	req.on('data', (e: Buffer) => {
		promiseChain = promiseChain.then((fd) => fd.write(e, 0, e.length, offset).then(r => {
			if (r.bytesWritten !== e.length) {
				throw new Error('Bytes read from http stream do not match bytes written');
			}
			offset += r.bytesWritten;
			return fd;
		}));
	});
	req.on('end', () => {
		promiseChain.then((fd) => {
			fd.close();
			if (offset > file.fileSize) {
				res.statusCode = 400;
				res.send('Too many bytes written! ' + offset + ' vs ' + file.fileSize);
			} else {
				res.statusCode = 204;
				res.send();
				if (offset === file.fileSize) {
					store.dispatch(crudDelete('pendingFile', file.token));
				}
			}
		}).catch(e => {
			rootPromise.then(fd => fd.close());
			res.statusCode = 500;
			console.error('Upload handler error', e);
			res.send(e.toString());
		});
	});
}
