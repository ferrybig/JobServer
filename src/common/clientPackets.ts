
export interface PingPacket {
	type: 'ping',
}
export interface PongPacket {
	type: 'pong',
}
export interface SubscribeEntityPacket {
	type: 'subscribe-entity',
	subscriptionId: number,
	module: 'workers' | 'task' | 'taskInformation' | 'repo' | 'deployment' | 'deploymentInformation';
	objectKey: string,
}
export interface SubscribeListPacket {
	type: 'subscribe-list',
	subscriptionId: number,
	module: 'workers' | 'task' | 'taskInformation' | 'repo' | 'deployment' | 'deploymentInformation';
	where: Record<string, string | number | boolean>;
}

export interface SubscribeEndPacket {
	type: 'subscribe-end',
	subscriptionId: number,
}
export interface SubscribeDataPacket {
	type: 'subscribe-entity-data',
	subscriptionId: number,
	data: any,
}
export interface SubscribeDataListPacket {
	type: 'subscribe-list-all',
	subscriptionId: number,
	data: any[],
}
export interface SubscribeDataListUpdatePacket {
	type: 'subscribe-list-modify',
	subscriptionId: number,
	index: number,
	modification: 'update' | 'insert' | 'removal'
}


export interface AuthRequest {
	type: 'auth-request',
	token: string,
}
export interface AuthChallenge {
	type: 'auth-challenge',
	challenge: string,
}
export interface AuthSolution {
	type: 'auth-solution',
	challenge: string,
	email: string
	password: string,
	otp: number,
}
export interface AuthResponse{
	type: 'auth-response',
	token: string,
	success: boolean,
	message: string,
}
export type ClientToServerPacket = PingPacket | SubscribeEntityPacket | SubscribeListPacket
