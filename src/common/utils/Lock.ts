const NO_OP = () => {};

export default class Lock {
	private locked: boolean = false;
	private pendingLockers: (() => void)[] = [];
	private onLock: () => void
	private onUnlock: () => void

	public constructor(onUnlock: () => void = NO_OP, onLock: () => void = NO_OP) {
		this.onLock = onLock;
		this.onUnlock = onUnlock;
	}

	public lock() {
		return new Promise<() => void>((resolve) => {
			const doLock = () => {
				resolve(() => {
					if(!this.locked) {
						throw new Error('Lock not locked');
					}
					const taker = this.pendingLockers.shift();
					if (taker) {
						taker();
					} else {
						this.locked = false;
						this.onUnlock();
					}
				});
			};
			if(!this.locked) {
				this.locked = true;
				this.onLock();
				return doLock();
			} else {
				this.pendingLockers.push(doLock);
			}

		});
	}
}
