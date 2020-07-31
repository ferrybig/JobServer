import dotenv from 'dotenv-safe';
import {resolve} from 'path';

dotenv.config({
	path: 'env/server.env',
	example: 'env/server.env.example'
});

function throwIfUndefined<T> (input: T): T extends undefined ? never : T {
	if(input === undefined) {
		throw new Error('Value should not be undefined');
	}
	return input as T extends undefined ? never : T;
}

export const CONFIG_PATH: string = throwIfUndefined(process.env.CONFIG);
export const CONFIG_RESET: boolean = throwIfUndefined(process.env.CONFIG_RESET) === 'true';
export const SSL_NGINX_PORT: string = throwIfUndefined(process.env.SSL_NGINX_PORT);
export const NOSSL_NGINX_PORT: string = throwIfUndefined(process.env.NOSSL_NGINX_PORT);
export const NGINX_CONFIG_PATH: string = resolve(throwIfUndefined(process.env.NGINX_CONFIG_PATH));
export const NGINX_CONFIG_CHECK: string = throwIfUndefined(process.env.NGINX_CONFIG_CHECK);
export const NGINX_RELOAD: string = throwIfUndefined(process.env.NGINX_RELOAD);
export const NGINX_RESTART: string = throwIfUndefined(process.env.NGINX_RESTART);
