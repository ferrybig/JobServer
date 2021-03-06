import dotenv from 'dotenv-safe';
import { resolve } from 'path';
import throwIfNotDefined from '../common/utils/throwIfNotDefined';

dotenv.config({
	path: 'env/server.env',
	example: 'env/server.env.example'
});

export const CONFIG_PATH: string = throwIfNotDefined(process.env.CONFIG);
export const CONFIG_RESET: boolean = throwIfNotDefined(process.env.CONFIG_RESET) === 'true';
export const SSL_NGINX_PORT: string = throwIfNotDefined(process.env.SSL_NGINX_PORT);
export const NOSSL_NGINX_PORT: string = throwIfNotDefined(process.env.NOSSL_NGINX_PORT);
export const NGINX_CONFIG_PATH: string = resolve(throwIfNotDefined(process.env.NGINX_CONFIG_PATH));
export const NGINX_CONFIG_CHECK: string = throwIfNotDefined(process.env.NGINX_CONFIG_CHECK);
export const NGINX_RELOAD: string = throwIfNotDefined(process.env.NGINX_RELOAD);
export const NGINX_RESTART: string = throwIfNotDefined(process.env.NGINX_RESTART);
export const GITHUB_CLIENT_ID: string = throwIfNotDefined(process.env.GITHUB_CLIENT_ID);
export const GITHUB_CLIENT_SECRET: string = throwIfNotDefined(process.env.GITHUB_CLIENT_SECRET);
export const FRONTEND_URL: string = throwIfNotDefined(process.env.FRONTEND_URL);
export const BACKEND_URL: string = throwIfNotDefined(process.env.BACKEND_URL);
export const JWT_SECRET: string = throwIfNotDefined(process.env.JWT_SECRET);
export const PORT: number = Number(process.env.PORT) || 5000;
