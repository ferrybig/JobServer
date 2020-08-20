import fetch, { RequestInit, Response } from 'node-fetch';
import { sign, verify } from 'jsonwebtoken';
import { JWT_SECRET } from './config';

interface AccessToken {
	readonly access_token: string;
	readonly scope: string[];
	readonly token_type: string;
}
interface AuthService {
	registerToken(token: Token): void;
	checkToken(sessionId: string, force?: boolean): Promise<boolean>;
	exportAsJWT(sessionId: string): string | null;
	JWTToId(sessionId: string): string;
	getLogin(sessionId: string): Pick<SessionToken, 'lastUse' | 'login' | 'name' | 'avatarUrl'> | null;
	unregisterSession(sessionId: string): void;
	makeRequest(sessionId: string, url: string, init?: RequestInit): Promise<Response>;
}
interface Token {
	readonly sessionId: string;
	readonly token: AccessToken;
	readonly login: string;
	readonly name: string;
	avatarUrl: string;
}
interface SessionToken extends Token {
	lastUse: number;
}
const ALGORITHM = 'HS512';

const sessionMap: Record<string, SessionToken | undefined> = {};
const loginMap: Record<string, string[] | undefined> = {};
const AuthService: AuthService = {
	unregisterSession(sessionId) {
		const existingToken = sessionMap[sessionId];
		if (existingToken) {
			// Delete it
			const loginArray = loginMap[existingToken.login];
			if (loginArray) {
				const index = loginArray.indexOf(sessionId);
				if (index >= 0) {
					loginArray.splice(index, 1);
					if (loginArray.length === 0) {
						delete loginMap[existingToken.login];
					}
				}
			}
			delete sessionMap[sessionId];
		}
	},
	registerToken(token) {
		const { sessionId, login } = token;
		AuthService.unregisterSession(sessionId);
		sessionMap[sessionId] = {
			...token,
			lastUse: Date.now(),
		};
		const loginArray = loginMap[login];
		if (!loginArray) {
			loginMap[login] = [sessionId];
		} else {
			loginArray.push(sessionId);
		}
	},
	makeRequest(sessionId, url, init) {
		const token = sessionMap[sessionId];
		if (!token) {
			return Promise.resolve(new Response(JSON.stringify({ message: 'Not authorized' }), {
				status: 401,
				statusText: 'Not authorized: no credentials',
			}));
		}
		console.log(token);
		const headers: RequestInit['headers'] = {
			accept: 'application/vnd.github.v3+json',
			authorization: `token ${token.token.access_token}`,
		};
		const extraInit: RequestInit = {
			headers: init?.headers ? {
				...init.headers,
				...headers,
			} : headers,
		};
		const finalInit: RequestInit = init ? {
			...init,
			...extraInit,
		} : extraInit;
		console.log(JSON.stringify(finalInit));
		return fetch(url, finalInit).then(res => {
			switch (res.status) {
				case 200:
				case 204:
					token.lastUse = Math.max(token.lastUse, Date.now());
					break;
				case 401:
					AuthService.unregisterSession(sessionId);
					break;
			}
			return res;
		});
	},
	async checkToken(sessionId, force = false) {
		console.log('checkToken', sessionId, force);
		if (!force && Date.now() - (sessionMap[sessionId]?.lastUse ?? 0) < 1000 * 60 * 10) {
			return true;
		}
		const res = await AuthService.makeRequest(sessionId, 'https://api.github.com/user');
		res.text().then(console.log);
		return res.ok;
	},
	exportAsJWT(sessionId) {
		const token = sessionMap[sessionId];
		if (!token) {
			return null;
		}
		return sign({
			sessionId: token.sessionId,
		}, JWT_SECRET, {
			algorithm: ALGORITHM,
			expiresIn: '10m',
		});
	},
	JWTToId(jwt) {
		try {
			const verified = verify(jwt, JWT_SECRET, {
				algorithms: [ALGORITHM]
			});
			if (typeof verified === 'object') {
				return (verified as any)?.sessionId;
			}
			throw new Error('Not a valid token! ' + JSON.stringify(verified));
		} catch(_) {
			return '';
		}

	},
	getLogin(sessionId) {
		const token = sessionMap[sessionId];
		return token ? {
			login: token.login,
			avatarUrl: token.avatarUrl,
			lastUse: token.lastUse,
			name: token.name,
		} : null;
	},
};
export default AuthService;
