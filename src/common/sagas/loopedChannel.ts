import { Channel, Task, EventChannel } from "redux-saga";
import {take} from "../utils/effects";
import {fork, call, cancel, CallEffect, ActionChannelEffect, ForkEffect} from "redux-saga/effects";

export type AnyChannel = Channel<any> | EventChannel<any>;

function* loopedChannelInternal(
	channelOrFactory: AnyChannel | CallEffect<AnyChannel> | ActionChannelEffect,
	handler: (packet: any, ...args: any[]) => void,
	options: {
		killLast?: boolean,
		nonBlocking?: boolean,
	} = {},
	args: any[]
) {
	const channel: AnyChannel = (
		channelOrFactory instanceof Function || ('type' in channelOrFactory && channelOrFactory.type === 'ACTION_CHANNEL')
		) ? yield channelOrFactory : channelOrFactory;
	let task: Task | null = null;
	try {
		while(true) {
			const packet = yield take(channel);
			if (options.nonBlocking) {
				if (options.killLast && task) {
					yield cancel(task);
				}
				task = yield fork(handler, packet, ...args);
			} else {
				yield call(handler, packet, ...args);
			}
		}
	} finally {
		channel.close();
		if (task) {
			yield cancel(task);
		}
	}
}

export type InferRest<F> = F extends (packet: any, ...args: infer A) => any ? A : [];
export type InferType<F> = F extends (packet: infer T, ...args: any) => any ? T : [];

export default function loopedChannel<T, H extends (packet: T, ...args: any[]) => void>(
	channel: AnyChannel | CallEffect<AnyChannel> | ActionChannelEffect,
	handler: H,
	options: {
		killLast?: boolean,
		nonBlocking?: boolean,
		doFork?: boolean
	} = {},
	...args: InferRest<H>
): CallEffect | ForkEffect {
	if (options.doFork) {
		return fork(loopedChannelInternal, channel, handler, options, args);
	} else {
		return call(loopedChannelInternal, channel, handler, options, args);
	}
}
