import NodeWebSocket from 'ws';
import { BuildTask } from '../common/types';
import { ServerToWorkerPacket, WorkerToServerPacket } from '../common/packets/workerPackets';
import fetch from 'node-fetch';
import { stat, open } from '../common/async/fs';
import assertNever from '../common/utils/assertNever';

interface LocalState<T extends string, D = null> {
	type: T,
	data: D,
}

type InternalState = LocalState<'idle', null>
| LocalState<'request-task', {
	done: (task: BuildTask) => void
}>
| LocalState<'executing-task', {
	log: string,
	taskId: BuildTask['id'],
}>
| LocalState<'executing-task-no-log', {
	log: string,
	taskId: BuildTask['id'],
}>
| LocalState<'uploading', {
	log: string,
	resultFile: string,
	fileSize: number,
	taskId: BuildTask['id'],
	done: () => void,
}>
| LocalState<'error', {
	log: string,
	taskId: BuildTask['id'],
	done: () => void,
}>;

const RECONNECT_TIMEOUT = 10000;
const PING_TIMER = 30000;
const CHUNK_SIZE = 1 * 1024 * 1024;

export default class UpstreamConnection {
	private state: InternalState = { type: 'idle', data: null };
	private isConnected: boolean = false;
	// During uploading, automatic reconnection is disabled
	private isUploading: boolean = false;
	private closed: boolean = false;
	private socket: NodeWebSocket;
	private socketUrl: string;
	private pingInterval: NodeJS.Timeout;

	public constructor(url: string) {
		this.socketUrl = url;
		this.socket = this.setupConnection();
		this.pingInterval = setInterval(() => {
			this.sendMessage({
				type: 'ping'
			});
		}, PING_TIMER);
	}

	public close() {
		this.closed = true;
		clearInterval(this.pingInterval);
	}

	private sendMessage(packet: WorkerToServerPacket) {
		try {
			if (this.isConnected) {
				console.debug('S<C: ' + JSON.stringify(packet));
				this.socket.send(JSON.stringify(packet));
			}
		} catch(e) {
			console.error(e);
		}
	}

	private setState(state: InternalState) {
		this.state = state;
	}
	private sendPacketForState() {
		switch(this.state.type) {
		case 'uploading':
			this.sendMessage({
				type: 'taskFinished',
				payload: {
					taskId: this.state.data.taskId,
					log: this.state.data.log,
					fileSize: this.state.data.fileSize,
				},
			});
			break;
		case 'error':
			this.sendMessage({
				type: 'taskError',
				payload: {
					taskId: this.state.data.taskId,
					log: this.state.data.log,
				},
			});
			break;
		case 'request-task':
			this.sendMessage({
				type: 'taskRequest',
			});
			break;

		}
	}
	private setStateAndSend(state: InternalState) {
		this.setState(state);
		this.sendPacketForState();
	}

	private setupConnection(): NodeWebSocket {
		const connection = new NodeWebSocket(this.socketUrl);
		connection.addEventListener('open', (e) => {
			this.isConnected = true;
			this.sendPacketForState();
		});
		connection.addEventListener('message', (e) => {
			console.debug('S>C: ' + e.data);
			const packet: ServerToWorkerPacket = JSON.parse(e.data);
			switch (packet.type) {
			case 'taskReceived':
				if (this.state.type === 'request-task') {
					const oldState = this.state;
					this.state = {
						type: 'executing-task',
						data: {
							log: '',
							taskId: packet.payload.task.id,
						},
					};
					oldState.data.done(packet.payload.task);
				} else {
					throw new Error('Invalid state for received packet');
				}
				break;
			case 'taskStartUpload':
				if (this.state.type === 'uploading') {
					this.startUpload(packet.payload.offset, packet.payload.url).catch((e) => {
						console.error('Error during uploading: ', e);

					});
				} else {
					throw new Error('Invalid state for received packet');
				}
				break;
			case 'pong':
				break;
			case 'taskResultUploaded':
				if (this.state.type === 'uploading' || this.state.type === 'error') {
					const oldState = this.state;
					this.state = {
						type: 'idle',
						data: null,
					};
					oldState.data.done();
				} else {
					throw new Error('Invalid state for received packet');
				}
				break;
			default:
				return assertNever(packet);

			}
		});
		connection.addEventListener('error', (e) => {
			console.error(e.type + ': ' + e.message);
		});
		connection.addEventListener('close', (e) => {
			this.isConnected = false;
			if (this.state.type === 'executing-task') {
				// Disable realtime logs for the current task
				this.setState({
					...this.state,
					type: 'executing-task-no-log',
				});
			}
			if (!this.closed) {
				console.log('Connection closed', e.wasClean, e.code, e.reason);
				const schedule = () => {
					setTimeout(() => {
						if (this.isUploading) {
							schedule();
						} else {
							this.socket = this.setupConnection();
						}
					}, RECONNECT_TIMEOUT);
				};
				schedule();
			}
		});
		return connection;
	}
	private async startUpload(offset: number, url: string): Promise<void> {
		try {
			this.isUploading = true;
			const state = this.state;
			if (state.type !== 'uploading') {
				throw new Error('State is not uploading: ' + JSON.stringify(this.state));
			}
			const fd = await open(state.data.resultFile, 'r');
			try {
				const buf = Buffer.alloc(CHUNK_SIZE);
				let lastRead: number;
				for (let currentOffset = offset; currentOffset < state.data.fileSize; currentOffset += lastRead) {
					const res = await fd.read(buf, 0, buf.length, currentOffset);
					lastRead = res.bytesRead;
					if (lastRead !== CHUNK_SIZE && state.data.fileSize - lastRead > currentOffset) {
						throw new Error('Read only read ' + lastRead + ' bytes, not the expected ' + CHUNK_SIZE);
					}
					const result = await fetch(url, {
						method: 'put',
						body: lastRead === CHUNK_SIZE ? buf : buf.slice(0, lastRead),
						headers: {
							'X-offset': String(currentOffset),
							'X-length': String(lastRead),
						}
					});
					if (!result.ok) {
						throw new Error('http status not ok: ' + result.status);
					}
				}
			} finally {
				fd.close();
			}
		} finally {
			this.isUploading = false;
		}
	}

	public addTaskLog(logPart: string, shouldSend: boolean = true) {
		if (this.state.type === 'executing-task' || this.state.type === 'executing-task-no-log') {
			this.state.data.log += logPart;
			if (this.state.type === 'executing-task' && shouldSend) {
				this.sendMessage({
					type: 'taskProgressAppend',
					payload: {
						taskId: this.state.data.taskId,
						logPart,
					}
				});
			}
		} else {
			throw new Error('State is not executing-task: ' + JSON.stringify(this.state));
		}
	}

	public requestTask(): Promise<BuildTask> {
		return new Promise((resolve, reject) => {
			if (this.state.type === 'idle') {
				this.setStateAndSend({
					type: 'request-task',
					data: {
						done: resolve,
					},
				});
			} else {
				reject(new Error('State is not idle: ' + JSON.stringify(this.state)));
			}
		});
	}

	public uploadSuccessResult(file: string): Promise<void> {
		return stat(file).then(({ size }) => new Promise((resolve, reject) => {
			if (this.state.type === 'executing-task' || this.state.type === 'executing-task-no-log') {
				this.setStateAndSend({
					type: 'uploading',
					data: {
						done: resolve,
						log: this.state.data.log,
						resultFile: file,
						fileSize: size,
						taskId: this.state.data.taskId,
					},
				});
			} else {
				reject(new Error('State is not executing-task: ' + JSON.stringify(this.state)));
			}
		}));
	}
	public uploadErrorResult(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.state.type === 'executing-task' || this.state.type === 'executing-task-no-log') {
				this.setStateAndSend({
					type: 'error',
					data: {
						done: resolve,
						log: this.state.data.log,
						taskId: this.state.data.taskId,
					},
				});
			} else {
				reject(new Error('State is not idle: ' + JSON.stringify(this.state)));
			}
		});
	}
}
