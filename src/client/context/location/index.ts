import { createContext } from 'react';
import subscriptionDebug from '../../../common/utils/subscriptionDebug';
import { addToFollowerArray } from '../../../common/utils/addToFollowerArray';
import callArray from '../../../common/utils/callArray';

interface UpdateOptions {
	replace?: boolean;
}

interface LocationContext  {
	path(): string;
	historyIndex(): number;
	lastInteraction(): number;
	onUpdate(onEvent: () => void): () => void;
	updatePath(path: string, options?: UpdateOptions): void;
	formatHref(path: string): string;
}

export function makeHashLocationContext(): LocationContext {
	const followers: (() => void)[] = [];

	interface HistoryState {
		historyIndex: number;
		lastInteractionTime: number;
	}

	function makeHistoryState(historyIndex: number, lastInteractionTime: number): HistoryState {
		return {
			historyIndex,
			lastInteractionTime,
		};
	}

	if (!window.history.state) {
		window.history.replaceState(makeHistoryState(0, Date.now()), '');
	}

	const getHistoryState = (): HistoryState => window.history.state;
	let currentState = getHistoryState();

	const locationService: LocationContext = {
		path() {
			const hash = window.location.hash;
			if (!hash.startsWith('#!/')) {
				return '/';
			}
			return hash.substring(2);
		},
		historyIndex() {
			return getHistoryState()?.historyIndex ?? Number.NaN;
		},
		lastInteraction() {
			return getHistoryState()?.lastInteractionTime ?? 0;
		},
		onUpdate(follower) {
			return addToFollowerArray(followers, follower);
		},
		updatePath(path, options = {}) {
			console.log('updatePath');
			const state = getHistoryState();
			if (options.replace) {
				currentState = makeHistoryState(state.historyIndex, Date.now());
				window.history.replaceState(currentState, '', `#!${path}`);
			} else {
				currentState = makeHistoryState(state.historyIndex + 1, Date.now());
				window.history.pushState(currentState, '', `#!${path}`);
			}
			callArray(followers);
		},
		formatHref(path) {
			return `#!${path}`;
		},
	};
	let lastPath = locationService.path();
	window.addEventListener('hashchange', (e) => {
		// User modified URL, thrown after popstate after a naigation event
		const newPath = locationService.path();
		if (newPath === lastPath) {
			return;
		}
		lastPath = newPath;
		currentState = makeHistoryState(currentState.historyIndex + 1, Date.now());
		window.history.replaceState(currentState, '');
		callArray(followers);
	});
	window.addEventListener('popstate', () => {
		// User did backwards or forwards navigation
		currentState = getHistoryState();
		if (!currentState) {
			// Should not happen
			console.warn('This should not happen! ', currentState);
			currentState = makeHistoryState(0, Date.now());
			window.history.replaceState(currentState, '');
		}
		lastPath = locationService.path();
		callArray(followers);
	});

	if (process.env.NODE_ENV === 'development') {
		locationService.onUpdate(subscriptionDebug(LocationContext.displayName, () => [locationService.path(), locationService.historyIndex(), new Date(locationService.lastInteraction())]));
	}
	return locationService;
}

const noopWarned = false;
const NoopLocationService: LocationContext = {
	path() {
		if (!noopWarned) {
			console.error('Using NoopLocationService, you need to provide a real location service');
		}
		return '/';
	},
	lastInteraction() {
		return 0;
	},
	historyIndex() {
		return 0;
	},
	onUpdate() {
		return () => {};
	},
	updatePath() {
	},
	formatHref() {
		return '#';
	},
};

const LocationContext = createContext<LocationContext>(NoopLocationService);
if (process.env.NODE_ENV === 'development') {
	LocationContext.displayName = 'LocationContext';
}
export default LocationContext;
