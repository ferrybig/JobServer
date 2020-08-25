import { ServerToClientPacket, ClientToServerPacket } from '../common/packets/clientPackets';
import assertNever from '../common/utils/assertNever';
import addToFollowerArray from '../common/utils/addToFollowerArray';
import callArray from '../common/utils/callArray';

type ServerState = 'connected' | 'connectionLost';

function mapWithValue<K extends string | number | symbol, V>(keys: K[], value: V): Record<K, V> {
	return Object.fromEntries(keys.map(k => [k, value] as const)) as Record<K, V>;
}

const RECONNECT_TIMEOUT = 10000;
const PING_TIMEOUT = 60000;

export class UpstreamServer {
	private packetMap: Record<ServerToClientPacket['type'], (packet: ServerToClientPacket) => void> = mapWithValue(['pong', 'entity-data', 'entity-end', 'auth-response'], undefined as unknown as (packet: ServerToClientPacket) => void);
	private serverStateMap: Record<ServerState, (() => void)[]> = { connected: [], connectionLost: [] };
	private beforeConnectHandlers: (() => void)[] = [];
	private connectionState: 'waiting' | 'connecting' | 'connecting-failed' | 'connected' = 'waiting';
	private socketUrl = '';
	private socket: WebSocket | null = null;

	public constructor() {
		this.registerPacketHandler('pong', () => {});
		window.setInterval(() => {
			this.sendPacket({
				type: 'ping',
			});
		}, PING_TIMEOUT);
	}

	public registerPacketHandler<T extends ServerToClientPacket['type']>(type: T, onPacket: (packet: Extract<ServerToClientPacket, { type: T }>) => void): () => void {
		const packetMap: Record<ServerToClientPacket['type'], undefined | ((packet: ServerToClientPacket) => void)> = this.packetMap;
		const existingHandler = packetMap[type];
		if (existingHandler) {
			console.error(packetMap);
			throw new Error('There is already a registration for ' + type);
		}
		packetMap[type] = onPacket as (packet: ServerToClientPacket) => void;
		return () => {
			if (packetMap[type] === onPacket) {
				packetMap[type] = () => {};
			}
		};
	}
	public addBeforeConnectHandlers(onEvent: () => Promise<void>): () => void {
		return addToFollowerArray(this.beforeConnectHandlers, onEvent);
	}
	public registerStateHandler(type: ServerState, onEvent: () => void): () => void {
		return addToFollowerArray(this.serverStateMap[type], onEvent);
	}
	public sendPacket(packet: ClientToServerPacket): void {
		if ((this.connectionState === 'connecting' || this.connectionState === 'connected') && this.socket) {
			const data = JSON.stringify(packet);
			console.info('S<C: ' + data);
			this.socket.send(data);
		}
	}
	public startConnection(socketUrl: string): void {
		for (const [key, handler] of Object.entries(this.packetMap)) {
			if (!handler) {
				throw new Error('No handler has been provides for packet type ' + key);
			}
		}
		this.socketUrl = socketUrl;
		this.socket = this.setupConnection();
	}

	private scheduleReconnect(): void {
		setTimeout(() => {
			if (window.navigator.onLine === false) {
				console.log('Refusing to connect because browser reports offline mode');
				this.scheduleReconnect();
			} else {
				this.socket = this.setupConnection();
			}
		}, RECONNECT_TIMEOUT);
	}
	private setupConnection(): WebSocket | null {
		try {
			const connection = new WebSocket(this.socketUrl);
			connection.addEventListener('open', (e) => {
				this.connectionState = 'connecting';
				// Call pre-cpnnect hooks
				Promise.all(callArray(this.beforeConnectHandlers)).then(() => {
					this.connectionState = 'connected';
					callArray(this.serverStateMap.connected);
				}, (e) => {
					console.error('Pre hooks error!', e);
					this.connectionState = 'waiting';
					connection.close();
				});
			});
			connection.addEventListener('message', (e) => {
				console.info('S>C: ' + e.data);
				const packet: ServerToClientPacket = JSON.parse(e.data);
				const handler = this.packetMap[packet.type];
				if (!handler) {
					return assertNever(handler, 'packet type ' + packet.type + ' not handled');
				}
				handler(packet);
			});
			connection.addEventListener('error', (e) => {
				console.error(e);
			});
			connection.addEventListener('close', (e) => {
				console.log('Connection closed', e.wasClean, e.code, e.reason);
				switch (this.connectionState) {
					case 'waiting':
						break;
					case 'connecting-failed':
						throw new Error('This state should never happen');
					case 'connecting':
						this.connectionState = 'connecting-failed';
						break;
					case 'connected':
						this.connectionState = 'waiting';
						callArray(this.serverStateMap.connectionLost);
						this.scheduleReconnect();
						break;
					default:
						return assertNever(this.connectionState);
				}
			});
			return connection;
		} catch(e) {
			console.error(e);
			this.scheduleReconnect();
			return this.socket;
		}
	}
}
