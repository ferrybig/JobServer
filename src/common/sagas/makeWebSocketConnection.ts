import NodeWebSocket from 'ws';
import {Channel, END, SagaIterator, EventChannel, channel, eventChannel} from 'redux-saga';
import {takeMaybe, apply, call, spawn} from 'redux-saga/effects';
import onEvent from '../utils/onEvent';

function* spawnSocketHelper(socket: WebSocket | NodeWebSocket, channel: Channel<string>) {
	while (true) {
		const packet = yield takeMaybe(channel);
		if (packet === END) {
			yield apply(socket, socket.close, []);
			return;
		} else {
			console.log('Send: ' + packet);
			yield apply(socket, socket.send, [packet]);
		}
	}
}

export default function* makeWebSocketChannel(url: string | WebSocket | NodeWebSocket): SagaIterator<readonly [EventChannel<string>, Channel<string>]> {
	const outgoing: Channel<string> = yield call(channel);
	const socket = typeof url === 'string' ? new WebSocket(url) : url;
	let error: string | null = null;
	const incoming = eventChannel<string>(emitter => {
		return onEvent(socket, {
			close(e) {
				console.warn('Close', e);
				error = e.reason;
				emitter(END); // Close incoming channel
				outgoing.close(); // Close outging channel
			},
			message (evt) {
				console.log('Receive: ' + evt.data);
				emitter(evt.data);
			},
			error (e) {
				console.warn('Caught error event: ' + e);
			},
			open() {
				console.log('Open ');
				emitter('@INIT');
			},
		}, socket.close);
	});
	console.log(socket.readyState);
	if (socket.readyState < 1 /* OPEN */) {
		const initPacket = yield takeMaybe(incoming);
		if (error !== null) {
			throw new Error(error || 'Connection timed out');
		}
		if (initPacket !== '@INIT') {
			throw new Error('Socket not ready yet');
		}
	}
	console.log('Returning ');
	yield spawn(spawnSocketHelper, socket, outgoing);
	return [incoming, outgoing] as const;
}