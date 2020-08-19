import dotenv from 'dotenv-safe';
import { resolve } from 'path';
import throwIfNotDefined from '../common/utils/throwIfNotDefined';

dotenv.config({
	path: 'env/worker.env',
	example: 'env/worker.env.example'
});

export const REPO_CACHE: string = resolve(throwIfNotDefined(process.env.REPO_CACHE));
export const WORKER_URL: string = throwIfNotDefined(process.env.WORKER_URL);
