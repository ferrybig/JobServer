import { connectionClient } from '../../store/actions';
import makeWebSocketChannel from '../../../common/sagas/makeWebSocketConnection';
import { call, fork } from 'redux-saga/effects';
import { Channel, EventChannel } from 'redux-saga';
import timeoutHandler from '../timeoutHandler';

export default function* handleWorkerConnection(data: ReturnType<typeof connectionClient>['payload']) {
	const [incoming, outgoing]: [EventChannel<string>, Channel<string>] = yield call(makeWebSocketChannel, data.webSocket);
	try {
		yield fork(timeoutHandler, data.webSocket);
		//		let handler = call(handleInitTask, {
		//			incoming,
		//			outgoing,
		//			worker,
		//			baseUrl: data.baseUrl,
		//		});
		//		while (handler) {
		//			handler = yield handler;
		//		}
	} catch(e) {
		console.error('Client error!', e); // todo yield action
	} finally {
		data.webSocket.terminate();
		outgoing.close();
		incoming.close();
	}
}
