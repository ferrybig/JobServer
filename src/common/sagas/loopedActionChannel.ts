import { SagaIterator, Buffer, buffers } from "redux-saga";
import { actionChannel, CallEffect, ForkEffect} from "redux-saga/effects";
import {AnyAction} from "redux";
import loopedChannel, {InferRest} from "./loopedChannel";

type ActionPattern = ((action: AnyAction) => boolean)
  | ((action: AnyAction) => action is any)
  | { type: string }[]
  | { type: string, (...args: any[]): AnyAction }[];

function isActionList(patterns: ActionPattern): patterns is { type: string }[] {
	return Array.isArray(patterns);
}

type ActionType<T extends ActionPattern> =
	T extends (arg: any) => arg is infer R ? R :
	T extends { type: string, (...args: any[]): infer R }[] ? R :
	AnyAction;

export default function loopedActionChannel<
	T extends ActionPattern,
	H extends (packet: ActionType<T>, ...args: any[]) => SagaIterator = (packet: ActionType<T>) => SagaIterator
>(
	pattern: T,
	handler: H,
	{buffer, ...options}: {
		killLast?: boolean,
		nonBlocking?: boolean,
		buffer?: Buffer<ActionType<T>>,
		doFork?: boolean,
	} = {},
	...args: InferRest<H>
): CallEffect | ForkEffect {
	const newPattern = isActionList(pattern) ? pattern.map(e => e.type) : (pattern as (action: AnyAction) => boolean);
	// TODO Figure out why buffers need to be resent, even thought he documentation documents it as optional
	const channel = actionChannel(newPattern, buffer || buffers.fixed(10));
	return loopedChannel<ActionType<T>, H>(channel, handler, options, ...args);
}