import NodeWebSocket from 'ws';
import { SagaIterator, eventChannel, END } from 'redux-saga';
import onEvent from '../../common/utils/onEvent';
import { take } from '../../common/utils/effects';
import assertNever from '../../common/utils/assertNever';
export default function* (webSocket: NodeWebSocket): SagaIterator<never> {
	const channel = eventChannel<'timeout'>(emitter => {
		let tick = 2;
		const intervalId = setInterval(() => {
			tick--;
			if (tick < 0) {
				emitter('timeout');
			}
		}, 60000);
		return onEvent(webSocket, {
			close() {
				emitter(END);
			},
			message() {
				tick = 2;
			},
		}, () => {
			clearInterval(intervalId);
		});
	});

	while (true) {
		const packet: 'timeout' = yield take(channel);
		switch (packet) {
			case 'timeout':
				throw new Error('Connection timed out');
			default:
				return assertNever(packet);
		}
	}
}
