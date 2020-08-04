import { createServer } from 'http';
import express, { Request } from 'express';
import WebSocket from 'ws';
import url from 'url';
import { Socket } from 'net';
import './polyfill';
import store, { startSagas } from './store';
import { connectionWorker, connectionClient } from './store/actions';
import { PORT } from './config';
import uploadPage from './pages/upload';
import webhookPage from './pages/webhook';
import stopNodeProcessOnError from '../common/utils/stopNodeProcessOnError';

const app = express();
const server = createServer(app);

const webSocketServer = new WebSocket.Server({
	noServer: true,
	perMessageDeflate: {
		zlibDeflateOptions: {
			// See zlib defaults.
			chunkSize: 1024,
			memLevel: 7,
			level: 3
		},
		zlibInflateOptions: {
			chunkSize: 10 * 1024
		},
		// Other options settable:
		clientNoContextTakeover: true, // Defaults to negotiated value.
		serverNoContextTakeover: true, // Defaults to negotiated value.
		serverMaxWindowBits: 10, // Defaults to negotiated value.
		// Below options specified as default values.
		concurrencyLimit: 10, // Limits zlib concurrency for perf.
		threshold: 1024 // Size (in bytes) below which messages
		// should not be compressed.
	}
});

server.on('upgrade', function upgrade(request: Request, socket: Socket, head: Buffer) {
	const pathname = url.parse(request.url).pathname || '';

	if (pathname.startsWith('/worker/') || pathname === '/client') {
		webSocketServer.handleUpgrade(request, socket, head, function done(ws) {
			webSocketServer.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
});
webSocketServer.on('connection', (webSocket, req) => {
	if (!req.url) {
		throw new Error('Request missing url');
	}
	if (!req.socket.remoteAddress) {
		throw new Error('Request missing req.socket.remoteAddress');
	}
	if (req.url.startsWith('/worker/')) {
		const workerId = req.url.substring('/worker/'.length);
		if (workerId.length !== 0) {
			store.dispatch(connectionWorker(webSocket, req.socket.remoteAddress, workerId, 'http://localhost:5000/'));
		}
	} else if (req.url === '/client') {
		store.dispatch(connectionClient(webSocket, req.socket.remoteAddress));
	} else { //TODO add websocket event for a client
		webSocket.terminate();
	}
	
});

app.put('/uploads/:token', uploadPage);
app.post('/webhook/:repo', webhookPage);

server.listen(PORT, () => console.info(`Server running on port: ${PORT}`));

startSagas().toPromise().catch(stopNodeProcessOnError);
