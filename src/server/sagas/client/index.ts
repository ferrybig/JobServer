import { connectionClient } from '../../store/actions';
import makeWebSocketChannel from '../../../common/sagas/makeWebSocketConnection';
import { call, fork, put, select, take as sagaTake, cancel, all } from 'redux-saga/effects';
import { Channel, EventChannel, SagaIterator, Task } from 'redux-saga';
import timeoutHandler from '../timeoutHandler';
import { ClientToServerPacket, ServerToClientPacket } from '../../../common/packets/clientPackets';
import { take } from '../../../common/utils/effects';
import serverViews, { Follower } from './views';
import assertNever from '../../../common/utils/assertNever';

function* sendPacket(outgoing: Channel<string>, packet: ServerToClientPacket) {
	yield put(outgoing, JSON.stringify(packet));
}

function* followerWatcher(outgoing: Channel<string>, iterator: Follower, requestId: number): SagaIterator<void> {
	while (true) {
		const action = yield sagaTake();
		const state = yield select();
		const packets = iterator.next([action, state]);
		if (packets.done) {
			yield* sendPacket(outgoing, {
				type: 'entity-end',
				requestId: requestId,
			});
			return;
		} else {
			for (const packet of packets.value) {
				yield* sendPacket(outgoing, {
					type: 'entity-data',
					requestId: requestId,
					data: packet,
				});
			}
		}
	}
}

export default function* handleClientConnection({ payload }: ReturnType<typeof connectionClient>): SagaIterator<void> {
	const [incoming, outgoing]: [EventChannel<string>, Channel<string>] = yield call(makeWebSocketChannel, payload.webSocket);
	const map: Record<number, Task> = {};
	try {
		yield fork(timeoutHandler, payload.webSocket);
		while (true) {
			const packet: ClientToServerPacket = JSON.parse(yield take(incoming));
			switch (packet.type) {
			case 'ping':
				yield* sendPacket(outgoing, {
					type: 'pong',
				});
				for (const [key, entry] of Object.entries(map)) {
					if (!entry.isRunning()) {
						delete map[Number(key)];
					}
				}
				break;
			case 'auth-request':
			case 'auth-solution':
				// ignore for now
				break;
			case 'entity-request':
				if (map[packet.requestId]) {
					throw new Error('Reuqest id ' + packet.requestId + ' already used!');
				}
				const view = serverViews[packet.viewId as keyof typeof serverViews];
				if (!view) {
					throw new Error('Missing view id: ' + packet.viewId);
				}
				const generator = view.makeFollower(yield select(), {}, packet.args as any);
				const result = generator.next();
				if (result.done) {
					// Generator returned without yielding something... Highly unusual, maybe its done later for permission isues?
					yield* sendPacket(outgoing, {
						type: 'entity-data',
						requestId: packet.requestId,
						data: {
							type: 'replace',
							data: null,
						},
					});
					if (packet.wantsSubscription) {
						yield* sendPacket(outgoing, {
							type: 'entity-end',
							requestId: packet.requestId,
						});
					}
					break;
				}
				for (const p of result.value) {
					yield* sendPacket(outgoing, {
						type: 'entity-data',
						requestId: packet.requestId,
						data: p,
					});
				}
				if (packet.wantsSubscription) {
					map[packet.requestId] = yield fork(followerWatcher, outgoing, generator, packet.requestId);
				} else {
					if (generator.return) {
						generator.return();
					}
				}
				break;
			case 'entity-end':
				if (map[packet.requestId]) {
					yield cancel(map[packet.requestId]);
					delete map[packet.requestId];
				}
				break;
			default:
				return assertNever(packet);
			}
		}
	} catch(e) {
		console.error('Client error!', e); // todo yield action
	} finally {
		payload.webSocket.terminate();
		outgoing.close();
		incoming.close();
		yield all(Object.values(map).map(e => cancel(e)));
	}
}
