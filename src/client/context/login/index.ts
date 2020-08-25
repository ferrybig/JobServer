import { createContext } from 'react';
import { TokenResponse } from '../../../common/types';
import assert from '../../../common/utils/assert';
import makeContextFollowers from '../../../common/utils/makeContextFollowers';
import subscriptionDebug from '../../../common/utils/subscriptionDebug';
import { UpstreamServer } from '../../UpstreamServer';

interface AuthValue {
	isLoggedIn: 'yes' | 'no' | 'unknown';
	avatarUrl: string;
	name: string;
	role: 'guest' | 'user' | 'admin';
	authToken: string;
}

interface AuthContext {
	getValue(): AuthValue;
	onUpdate(follower: () => void): () => void;
	registerServerHandler(server: UpstreamServer): void;
	doLogin(event?: {preventDefault(): void}): void;
	loginUrl(): string;
}
const AuthContext = createContext<AuthContext>({
	onUpdate: () => () => {},
	getValue() {
		throw new Error(`No ${AuthContext.displayName} has ben provided in the component stack`);
	},
	registerServerHandler: () => () => Promise.resolve(),
	doLogin() {
		throw new Error(`No ${AuthContext.displayName} has ben provided in the component stack`);
	},
	loginUrl: () => '#',
});

if (process.env.NODE_ENV === 'development') {
	AuthContext.displayName = 'AuthContext';
}

const LOGGED_IN_KEY = 'JOBSERVER_LOGGED_IN';
const DEFAULT_LOGIN_STATE: AuthValue = {
	isLoggedIn: 'unknown',
	avatarUrl: '',
	name: '',
	role: 'guest',
	authToken: '',
};

const openPopup = (...args: Parameters<typeof window.open>) => new Promise<Window | undefined>(resolve => {
	const popup = window.open(...args);
	if (!popup || popup.closed){
		return resolve();
	}
	window.setTimeout(() => (popup.innerHeight > 0 && !popup.closed) ? resolve(popup) : resolve(), 200);
});

export function makeAuthContext(loginUrl: string): AuthContext {
	let state: AuthValue = JSON.parse(window.sessionStorage.getItem(LOGGED_IN_KEY) ?? 'null') || DEFAULT_LOGIN_STATE;
	const { onUpdate, doUpdate } = makeContextFollowers();
	onUpdate(() => {
		window.sessionStorage.setItem(LOGGED_IN_KEY, JSON.stringify(state));
	});
	let upstreamServer: UpstreamServer | null = null;
	window.addEventListener('storage', (e) => {
		if (e.storageArea === window.sessionStorage && e.key === LOGGED_IN_KEY) {
			state = JSON.parse(window.sessionStorage.getItem(LOGGED_IN_KEY) ?? 'null') || DEFAULT_LOGIN_STATE;
			doUpdate();
			if (state.isLoggedIn === 'yes') {
				upstreamServer?.sendPacket({
					type: 'auth-request',
					token: state.authToken,
				});
			}
		}
	});

	async function handleTokenFetch(force = false) {
		if (state.isLoggedIn !== 'no' || force) {
			const tokenResponse = await fetch(`${loginUrl}/token`, {
				mode: 'cors',
				credentials: 'include',
			});

			const token: TokenResponse = await tokenResponse.json();
			assert('loggedIn' in token);
			if (token.loggedIn) {
				state = {
					...state,
					isLoggedIn: 'yes',
					avatarUrl: token.avatarUrl,
					name: token.name,
					authToken: token.token,
				};
				doUpdate();
				upstreamServer?.sendPacket({
					type: 'auth-request',
					token: token.token,
				});
			} else {
				state = {
					...DEFAULT_LOGIN_STATE,
					isLoggedIn: 'no',
				};
				doUpdate();
			}
		}
	}

	window.addEventListener('message', (e) => {
		console.log(e);
		if (e.origin !== window.origin) {
			return;
		}
		if (e.data?.type === 'login' && e.data?.loggedIn) {
			console.log('Got login from another window!');
			handleTokenFetch(true);
		}
	}, false);

	const value: AuthContext = {
		getValue: () => state,
		onUpdate,
		async doLogin(event) {
			event?.preventDefault();
			const popup = await openPopup(`${loginUrl}?iframe=true`, 'oauth', 'menubar=no');
			if (!popup) {
				console.log('Open popup failed!');
				window.location.href = loginUrl;
			}
		},
		loginUrl: () => loginUrl,
		registerServerHandler(server: UpstreamServer) {
			upstreamServer = server;
			server.addBeforeConnectHandlers(handleTokenFetch);
			server.registerPacketHandler('auth-response', (p) => {
				state = {
					...state,
					role: p.role,
				};
				doUpdate();
			});
		},
	};
	if (process.env.NODE_ENV === 'development') {
		value.onUpdate(subscriptionDebug(AuthContext.displayName, () => value.getValue()));
	}
	return value;
}
export default AuthContext;
