import { spawn, ChildProcess } from 'child_process';
import { open, close } from 'fs';

interface Options {
	logger?: (str: string) => void,
	cwd?: string,
	stdin?: string,
}

function startProcess(command: string, args: string[], options: Options, resolve: (err: any, process: ChildProcess) => void) {
	function start(stdIn: number | null) {
		if (options.logger) {
			options.logger('\n$ "' + [command, ...args].join('" "') + '"\n');
		}
		const proc = spawn(command, args, {
			cwd: options.cwd,
			stdio: [
				stdIn !== null ? stdIn : 'pipe',
				'pipe',
				'pipe'
			],
		});
		if (stdIn !== null) {
			close(stdIn, (e) => {
				if (e) {
					console.warn(e);
				}
			});
		}
		resolve(null, proc);
	}
	if (options.stdin) {
		open(options.stdin, 'r', (err, fd) => {
			if (err) {
				resolve(err, null as unknown as ChildProcess);
			} else {
				start(fd);
			}
		});
	} else {
		start(null);
	}
}

export default function runCommand(command: string, args: string[], options: Options = {}): Promise<string> {
	return new Promise((resolve, reject) => {
		startProcess(command, args, options, (err, ps) => {
			if (err) {
				return reject(err);
			}
			let log = '';
			ps.stdout!.on('data', (data) => {
				const asString = String(data);
				log += asString;
				if (options.logger) {
					options.logger(asString);
				}
			});
			ps.stderr!.on('data', (data) => {
				const asString = String(data);
				log += asString;
				if (options.logger) {
					options.logger(asString);
				}
			});
			ps.on('close', (code) => {
				if (code) {
					return reject(new Error('Process exited with code: ' + code + '\n\n' + log));
				} else {
					return resolve(log);
				}
			});
			ps.on('error', (code) => {
				return reject(code);
			});
		});
	});
}
