/// <reference="../../types/nodeFallBack.d.ts"/>

import NodeWebSocket from 'ws';

type TargetToMapType<T> =
//	T extends WebSocket ? WebSocketEventMap :
//	T extends RTCDataChannel ? RTCDataChannelEventMap :
//	T extends RTCPeerConnection ? RTCPeerConnectionEventMap :
	T extends NodeWebSocket ? {
		message: { data: any; type: string; target: NodeWebSocket };
		close: { wasClean: boolean; code: number; reason: string; target: NodeWebSocket };
		error: { error: any; message: any; type: string; target: NodeWebSocket };
		open: { target: NodeWebSocket };
	} :
	//	T extends MediaStream ? MediaStreamEventMap :
	//	T extends MediaStreamTrack ? MediaStreamTrackEventMap :
	//	T extends HTMLVideoElement ? HTMLVideoElementEventMap :
	//	T extends HTMLElement ? HTMLElementEventMap :
	//	T extends Window ? WindowEventMap :
	Record<string, any>

type MapTypesToMap<O extends Record<string,any>, T> = { [K in keyof O]?: (this: T, event: O[K]) => void };

export default function onEvent<T extends {
	addEventListener(event: string, callback: (this: T, event: any) => void): void;
	removeEventListener(event: string, callback: (this: T, event: any) => void): void;
}>(
	target: T,
	map: MapTypesToMap<TargetToMapType<T>, T>,
	onClose?: (this: T) => void,
): () => void {
	const entries = Object.entries(map).filter((e): e is [string, (arg: any) => void] => !!e[1]);
	for (const [key, callback] of entries) {
		target.addEventListener(key, callback);
	}
	return () => {
		for (const [key, callback] of entries) {
			target.removeEventListener(key, callback);
		}
		if (onClose) {
			onClose.apply(target);
		}
	};
}
