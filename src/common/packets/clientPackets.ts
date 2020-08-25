import { AuthorizedUser } from '../types';

export interface PingPacket {
	type: 'ping';
}
export interface PongPacket {
	type: 'pong';
}
export interface EntityRequestPacket {
	type: 'entity-request';
	requestId: number;
	viewId: string;
	args: string[];
	wantsSubscription: boolean;
}
export interface EntityDataPacket {
	type: 'entity-data';
	requestId: number;
	data: SubscriptionListChangeData<any> | SubscriptionSingleChangeData<any>;
}
export interface EntityEndPacket {
	type: 'entity-end';
	requestId: number;
}


export interface AuthRequestPacket {
	type: 'auth-request';
	token: string;
}
export interface AuthResponsePacket {
	type: 'auth-response';
	loggedIn: boolean;
	role: AuthorizedUser['role'];
}


export type SubscriptionListChangeData<F> = {
	type: 'replace';
	data: F[];
} | {
	type: 'delete';
	index: number;
} | {
	type: 'update';
	index: number;
	data: Partial<F>;
} | {
	type: 'insert';
	index: number;
	data: F;
};
export type SubscriptionSingleChangeData<F> = {
	type: 'replace';
	data: F;
} | {
	type: 'update';
	data: Partial<F>;
} | {
	type: 'concat';
	data: { [K in keyof F]?: F[K] extends string ? Extract<string, F[K]> : never };
};

export type ClientToServerPacket = PingPacket | AuthRequestPacket | EntityRequestPacket | EntityEndPacket
export type ServerToClientPacket = PongPacket | AuthResponsePacket | EntityDataPacket | EntityEndPacket
