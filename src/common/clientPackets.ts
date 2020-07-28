
export interface PingPacket {
	type: 'ping',
}
export interface PongPacket {
	type: 'pong',
}
export interface SubscribeEntityPacket {
	type: 'subscribe-entity',
	id: number,
	module: 'workers' | 'task' | 'taskInformation' | 'repo' | 'deployment' | 'deploymentInformation';
	objectKey: string,
}
export interface SubscribeListPacket {
	type: 'subscribe-list',
	id: number,
	module: 'workers' | 'task' | 'taskInformation' | 'repo' | 'deployment' | 'deploymentInformation';
	where: Record<string, string | number | boolean>;
}

export interface SubscribeEndPacket {
	type: 'subscribe-end',
	id: number,
}
export interface SubscribeDataPacket {
	type: 'subscribe-data',
	id: number,
	data: any,
}
