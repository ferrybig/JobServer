import { buffers, Buffer, channel } from 'redux-saga';

class LoggingBuffer<T> implements Buffer<T> {
	private prefix: string;
	private buffer: Buffer<T>
	public constructor(prefix: string, buffer: Buffer<T>) {
		this.prefix = prefix;
		this.buffer = buffer;
	}
	public isEmpty(): boolean {
		return this.buffer.isEmpty();
	}
	public take(): T | undefined {
		const val = this.buffer.take();
		if (val !== undefined) {
			console.log(this.prefix, val);
		}
		return val;
	}
	public put(data: T): void {
		console.log(this.prefix, data);
		return this.buffer.put(data);
	}
	public flush(): T[] {
		return this.buffer.flush();
	}
}

export default function loggingChannel<T>(prefix: string, buffer: Buffer<T> = buffers.expanding()) {
	return channel(new LoggingBuffer(prefix, buffer));
}
