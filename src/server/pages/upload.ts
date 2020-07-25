import {Request, Response, NextFunction} from "express";
import store from '../store/'
import {getOrNull} from "../store/selectors";
import {dirname} from 'path'
import {mkdir, open} from "../../common/async/fs";
import {crudDelete} from "../store/actions";

export default function uploadPage(req: Request, res: Response, next: NextFunction) {
	const token = req.params.token;
	let offset = Number(req.headers['X-offset'] || '0');
	const file = getOrNull(store.getState(), 'pendingFiles', token);
	if(!file) {
		res.statusCode = 404;
		res.send('entity not found');
		return;
	}
	const dir = dirname(file.outputFile);
	let promiseChain = mkdir(dir, {
		recursive: true
	}).then(() => open(file.outputFile, 'w'));

	console.log(token)
	req.on('data', (e: Buffer) => {
		promiseChain = promiseChain.then((fd) => fd.write(e, 0, e.length, offset).then(r => {
			if (r.bytesWritten !== e.length) {
				throw new Error('Bytes read from htp stream do not match bytes written');
			}
			offset += r.bytesWritten;
			return fd;
		}))
	})
	req.on('end', () => {
		console.log('end')
		promiseChain.then((fd) => {
			fd.close();
			if (offset > file.fileSize) {
				res.statusCode = 400;
				res.send('To many bytes written! ' + offset + ' vs ' + file.fileSize);
			} else {
				res.statusCode = 204;
				res.send();
				if (offset === file.fileSize) {
					store.dispatch(crudDelete('pendingFiles', file.token));
				}
			}
		})
	})
}