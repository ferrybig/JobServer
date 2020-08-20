import { Request, Response, NextFunction, Express } from 'express';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';
import { BACKEND_URL, GITHUB_CLIENT_ID, FRONTEND_URL, GITHUB_CLIENT_SECRET } from '../config';
import FormData from 'form-data';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AuthService from '../AuthService';


function sendFormData(url: string | FormData.SubmitOptions, data: FormData): Promise<string> {
	return new Promise((resolve, reject) => {
		data.submit(url, (err, res) => {
			if (err) {
				return reject(err);
			}
			res.setEncoding('utf8');
			let body = '';
			res.on('data', chunk => body += chunk);
			res.on('end', () => resolve(body));
		}).on('error', reject);
	});
}

interface UserSession {
	state: string;
}

const SESSION_COOKIE_NAME = 'APP_SESSION';
const REDIRECT_URL = BACKEND_URL + 'login/auth';

const userSessionMap: Record<string, UserSession | undefined> = {};

export default function registerLoginPage(app: Express, AuthService: AuthService) {
	app.get('/login/token', (req: Request, res: Response, next: NextFunction) => {
		const sessionId = req.cookies[SESSION_COOKIE_NAME];
		const jwt = AuthService.exportAsJWT(sessionId);
		if (jwt) {
			res.statusCode = 200;
			res.send(jwt);
		} else {
			res.statusCode = 401;
			res.send();
		}
	});
	app.get('/login/logout', (req: Request, res: Response, next: NextFunction) => {

	});
	app.get('/login/auth', async (req: Request, res: Response, next: NextFunction) => {
		try {
			const sessionId = req.cookies[SESSION_COOKIE_NAME];
			const code = req.query.code;
			const state = req.query.state;
			if (!code || !state || !sessionId) {
				console.info('[WEB] Auth expired for ' + req.ip);
				return res.redirect(FRONTEND_URL);
			}
			const session = userSessionMap[sessionId];
			if (!session) {
				console.info('[WEB] Auth state missing for ' + req.ip);
				return res.redirect(FRONTEND_URL);
			}
			delete userSessionMap[sessionId];
			if (session.state !== state) {
				console.info('[WEB] Auth mismatch for ' + req.ip);
				return res.redirect(FRONTEND_URL);
			}
			const form = new FormData();
			form.append('client_id', GITHUB_CLIENT_ID);
			form.append('client_secret', GITHUB_CLIENT_SECRET);
			form.append('code', code);
			form.append('redirect_uri', REDIRECT_URL);
			form.append('state', session.state);
			const json = await sendFormData({
				hostname: 'github.com',
				protocol: 'https:',
				path: '/login/oauth/access_token',
				headers: {
					accept: 'application/json',
				},
			}, form);
			const token = JSON.parse(json);
			if ('error' in token && token.error) {
				throw new Error(JSON.stringify(token));
			}
			const userResponse = await fetch('https://api.github.com/user', {
				headers: {
					authorization: `token ${token.access_token}`,
					accept: 'application/vnd.github.v3+json',
				},
			});
			if (!userResponse.ok) {
				throw new Error('!userResponse.ok: ' + await userResponse.text());
			}
			const { login, avatar_url: avatarUrl, name } = await userResponse.json();
			console.info('[WEB] Success? ' + req.ip + ': ' + login);
			const newSessionId = uuid();
			res.cookie(SESSION_COOKIE_NAME, newSessionId, { maxAge: 60 * 60 * 12 * 356 * 1000 });
			AuthService.registerToken({
				sessionId: newSessionId,
				token,
				login,
				avatarUrl,
				name,
			});
			return res.redirect(FRONTEND_URL);
		} catch(e) {
			console.info('[WEB] Auth error for ' + req.ip);
			console.error(e);
			return res.redirect(FRONTEND_URL);
		}


	});
	app.get('/login/', async (req: Request, res: Response, next: NextFunction) => {
		console.info('[WEB] Auth start for ' + req.ip);
		const cookie = req.cookies[SESSION_COOKIE_NAME];
		delete userSessionMap[cookie];
		if (await AuthService.checkToken(cookie, true)) {
			console.info('[WEB] Auth bypass for ' + req.ip);
			return res.redirect(FRONTEND_URL);
		}
		const newCookie = uuid();
		res.cookie(SESSION_COOKIE_NAME, newCookie, { maxAge: 10 * 60 * 1000 });
		const state = uuid();
		userSessionMap[newCookie] = {
			state,
		};

		const params: Record<string, string> = {
			// eslint-disable-next-line @typescript-eslint/camelcase
			client_id: GITHUB_CLIENT_ID,
			// eslint-disable-next-line @typescript-eslint/camelcase
			redirect_uri: REDIRECT_URL,
			scope: 'repo write:repo_hook',
			state,
		};
		res.redirect(`https://github.com/login/oauth/authorize?${Object.entries(params).map(e => `${encodeURIComponent(e[0])}=${encodeURIComponent(e[1])}`).join('&')}`);
	});
}
