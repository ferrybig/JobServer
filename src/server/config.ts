import dotenv from 'dotenv-safe';
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
