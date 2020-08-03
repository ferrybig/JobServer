
export interface PingPacket {
	type: 'ping',
}
export interface PongPacket {
	type: 'pong',
}
export interface EntityRequestPacket {
	type: 'entity-request',
	requestId: number,
	viewId: string,
	args: string[],
	wantsSubscription: boolean,
}
export interface EntityDataPacket {
	type: 'entity-data',
	requestId: number,
	data: SubscriptionListChangeData | SubscriptionSingleChangeData,
}
export interface EntityEndPacket {
	type: 'entity-end',
	requestId: number,
}


export interface AuthRequestPacket {
	type: 'auth-request',
	token: string,
}
export interface AuthChallengePacket {
	type: 'auth-challenge',
	challenge: string,
}
export interface AuthSolutionPacket {
	type: 'auth-solution',
	solution: string,
	email: string
	password: string,
	otp: number,
}
export interface AuthResponsePacket {
	type: 'auth-response',
	token: string,
	status: 'challenge-expired' | 'success' | 'error',
	message: string,
}


export type SubscriptionListChangeData = {
	type: 'replace',
	data: any[],
} | {
	type: 'delete',
	index: number
} | {
	type: 'update',
	index: number
	data: any,
} | {
	type: 'insert',
	index: number
	data: any,
};
export type SubscriptionSingleChangeData = {
	type: 'replace',
	data: any,
} | {
	type: 'update',
	data: Partial<any>,
} | {
	type: 'concat',
	data: Partial<any>,
};

export type ClientToServerPacket = PingPacket | AuthRequestPacket | AuthSolutionPacket | EntityRequestPacket | EntityEndPacket
export type ServerToClientPacket = PongPacket | AuthChallengePacket | AuthResponsePacket | EntityDataPacket | EntityEndPacket
