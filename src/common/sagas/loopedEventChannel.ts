import { eventChannel, Subscribe, Buffer } from "redux-saga";
import { CallEffect, ForkEffect} from "redux-saga/effects";
import loopedChannel, {InferRest, InferType} from "./loopedChannel";

export default function loopedEventChannel<
	H extends (packet?: any, ...args: any[]) => void = (packet: any) => void
>(
	subscribe: Subscribe<InferType<H>>,
	handler: H,
	{buffer, ...options}: {
		killLast?: boolean,
		nonBlocking?: boolean,
		buffer?: Buffer<InferType<H>>,
		doFork?: boolean,
	} = {},
	...args: InferRest<H>
): CallEffect | ForkEffect {
	const channel = eventChannel<InferType<H>>(subscribe, buffer);
	return loopedChannel<InferType<H>, H>(channel, handler, options, ...args);
}