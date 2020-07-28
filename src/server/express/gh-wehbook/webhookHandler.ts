import {Request, Response, NextFunction} from "express";
import crypto from 'crypto';
import {Webhook, UnknownWebhook} from "./webhookTypes";



function makeWebhookData(type: string, body: any): Webhook {
	const castedType = type as Exclude<Webhook['type'], UnknownWebhook['type']> | undefined
	switch(castedType) {
		case 'ping':
		case 'push':
			return {
				type: castedType,
				data: body,
			};
		default:
			const type: undefined = castedType;
			return {
				type: '?',
				data: body,
				originalType: type as unknown as string,
			};
	}
}

function valueNotArray<T>(input: T): T extends any[] ? undefined : T {
	if (Array.isArray(input)) {
		return undefined as T extends any[] ? undefined : T;
	}
	return input as T extends any[] ? undefined : T;
}

export default function makeWebhookHandler<T>(
	getSecret: (req: Request) => [string, T] | string | undefined,
	handleWebhook: (data: {
		body: Webhook,
		secret: string,
		extra: T,
		deliveryUUID: string,
		signature: string,
	}, req: Request, res: Response, next: NextFunction) => void
): (req: Request, res: Response, next: NextFunction) => void {
	return (req, res, next) => {
		if (req.method !== 'POST') {
			res.statusCode = 405;
			res.send('');
			return;
		}
		const contentType = valueNotArray(req.headers['content-type']);
		if (contentType !== 'application/json') {
			res.statusCode = 400;
			res.send('Content-type should be "application/json"');
			return;
		}
		const eventType = valueNotArray(req.headers['x-github-event']);
		if (!eventType) {
			res.statusCode = 400;
			res.send('');
			return;
		}
		const deliveryUUID = valueNotArray(req.headers['x-github-delivery']);
		if (!deliveryUUID) {
			res.statusCode = 400;
			res.send('');
			return;
		}
		const actualSignature = valueNotArray(req.headers['x-hub-signature']);
		if (!actualSignature) {
			res.statusCode = 400;
			res.send('');
			return;
		}
		const secret = getSecret(req);
		if (!secret) {
			// Send error after consuming the body, this way the other side does not know the difference between signature failure and a missing secret;
			req.on('end', () => {
				res.statusCode = 404;
				res.send('');
			});
			return;
		}
		const token = Array.isArray(secret) ? secret[0] : secret;
		const extra: T = Array.isArray(secret) ? secret[1] : undefined as unknown as T;

		let body = '';
		req.setEncoding('utf-8')
		req.on('data', (e: string) => {
			body += e;
		});
		req.on('end', () => {
			const expectedSignature = `sha1=${crypto
				.createHmac('sha1', token)
				.update(body)
				.digest('hex')}`;
			if (expectedSignature !== actualSignature) {
				// Todo, add a config flag for this warning
				console.warn('signatures do not match: ', expectedSignature, actualSignature);
				// Send a 404, so the other side does not realise this mistake
				res.statusCode = 404;
				res.send('');
				return;
			}
			handleWebhook({
				body: makeWebhookData(eventType, JSON.parse(body)),
				secret: token,
				extra,
				deliveryUUID,
				signature: actualSignature,
			}, req, res, next);
		});
	}
}