import Lock from './Lock';

export default class KeyedLock {
	private locks = new Map<string, Lock>()
	private getLock(key: string): Lock {
		const lock = this.locks.get(key);
		if (lock) {
			return lock;
		}
		const newLock = new Lock(() => {
			this.locks.delete(key);
		});
		this.locks.set(key, newLock);
		return newLock;

	}
	public lock(key: string): Promise<() => void> {
		return this.getLock(key).lock();
	}
}
