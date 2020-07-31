import NodeWebSocket from 'ws';
import {Channel, END, SagaIterator, EventChannel, channel, eventChannel} from 'redux-saga';
import {takeMaybe, apply, call, spawn} from 'redux-saga/effects';
import onEvent from '../utils/onEvent';

function* spawnSocketHelper(socket: NodeWebSocket, channel: Channel<string>) {
	while (true) {
		const packet = yield takeMaybe(channel);
		if (packet === END) {
			yield apply(socket, socket.close, []);
			return;
		} else {
			yield call(() => socket.send(packet))
		}
	}
}

export default function* makeWebSocketChannel(url: string | NodeWebSocket): SagaIterator<readonly [EventChannel<string>, Channel<string>]> {
	const outgoing: Channel<string> = yield call(channel);
	const socket = typeof url === 'string' ? new NodeWebSocket(url) : url;
	let error: string | null = null;
	const incoming = eventChannel<string>(emitter => {
		return onEvent(socket, {
			close(e) {
				console.warn('Close', e.code,  e.reason);
				error = e.reason;
				emitter(END); // Close incoming channel
				outgoing.close(); // Close outging channel
			},
			message (evt) {
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
	if (socket.readyState < 1 /* OPEN */) {
		const initPacket = yield takeMaybe(incoming);
		if (error !== null) {
			throw new Error(error || 'Connection timed out');
		}
		if (initPacket !== '@INIT') {
			throw new Error('Socket not ready yet');
		}
	}
	yield spawn(spawnSocketHelper, socket, outgoing);
	return [incoming, outgoing] as const;
}