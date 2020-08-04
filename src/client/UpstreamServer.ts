import { ServerToClientPacket, ClientToServerPacket } from "../common/packets/clientPackets";
import assertNever from "../common/utils/assertNever";
import Filter from "../common/utils/Filter";

type ServerState = 'connected' | 'connectionLost';

function mapWithValue<K extends string | number | symbol, V>(keys: K[], value: V): Record<K, V> {
	return Object.fromEntries(keys.map(k => [k, value] as const)) as Record<K, V>;
}

const RECONNECT_TIMEOUT = 10000;
const PING_TIMEOUT = 60000;

export class UpstreamServer {
	private packetMap: Record<ServerToClientPacket['type'], (packet: ServerToClientPacket) => void> = mapWithValue(["pong", "auth-challenge", "entity-data", "entity-end", "auth-response"], undefined as unknown as (packet: ServerToClientPacket) => void);
	private serverStateMap: Record<ServerState, (() => void)[]> = { connected: [], connectionLost: [] };
	private isConnected = false;
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

	public registerPacketHandler<T extends ServerToClientPacket['type']>(type: T, onPacket: (packet: Filter<ServerToClientPacket, { type: T }>) => void): () => void {
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
	public registerStateHandler(type: ServerState, onEvent: () => void): () => void {
		this.serverStateMap[type].push(onEvent);
		return () => {
			const index = this.serverStateMap[type].indexOf(onEvent);
			if (index >= 0) {
				this.serverStateMap[type].splice(index, 1);
			}
		};
	}
	public sendPacket(packet: ClientToServerPacket) {
		if (this.isConnected && this.socket) {
			const data = JSON.stringify(packet);
			console.info('S<C: ' + data);
			this.socket.send(data);
		}
	}
	public startConnection(socketUrl: string) {
		for (const [key, handler] of Object.entries(this.packetMap)) {
			if (!handler) {
				throw new Error('No handler has been provides for packet type ' + key);
			}
		}
		this.socketUrl = socketUrl;
		this.socket = this.setupConnection();
	}

	private scheduleReconnect() {
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
				this.isConnected = true;
				for (const follower of this.serverStateMap.connected) {
					follower();
				}
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
				if (this.isConnected) {
					this.isConnected = false;
					for (const follower of this.serverStateMap.connectionLost) {
						follower();
					}
				}
				this.scheduleReconnect();
			});
			return connection;
		} catch(e) {
			console.error(e);
			this.scheduleReconnect();
			return this.socket;
		}
	}
}
