import addToFollowerArray from './addToFollowerArray';
import callArray from './callArray';

export default function makeContextFollowers<P extends any[] = []>() {
	const followers: ((...args: P) => void)[] = [];
	return {
		followers,
		onUpdate: (follower: (...args: P) => void) => addToFollowerArray(followers, follower),
		doUpdate: (...args: P) => callArray(followers, ...args),
	};
}
