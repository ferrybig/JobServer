import React, { ComponentType } from 'react';
import provideDefaults from '../../../common/utils/provideDefaults';

export class RouteDefinicationDefiner<P, I> {
	private pathTransform: (path: string) => P | null;
	public readonly toPath: (path: I) => string;
	public priority: number;
	public debugValue: string;
	public constructor(pathTransform: (path: string) => P | null, toPath: (path: I) => string, priority: number) {
		this.pathTransform = pathTransform;
		this.toPath = toPath;
		this.priority = priority;
		this.debugValue = '';
	}
	public component<C = P>(Component: ComponentType<C>): RouteDefinication<Pick<C, Exclude<keyof C, keyof P>>, I> {
		return this.render<C>((props) => <Component {...props}/>);
	}
	public render<C = P>(render: (props: C) => null | JSX.Element): RouteDefinication<Pick<C, Exclude<keyof C, keyof P>>, I> {
		const transform = this.pathTransform;

		let matchedProps: P | null;

		function doRender(extraProps: Pick<C, Exclude<keyof C, keyof P>>) {
			return render({
				...extraProps,
				...matchedProps!,
			} as unknown as C);
		}
		return {
			tryRender(path) {
				matchedProps = transform(path);
				if (matchedProps) {
					return doRender;
				}
				return null;
			},
			toPath: this.toPath,
			priority: this.priority,
			debugValue: this.debugValue,
		};
	}
	public mapForward<R>(mapping: (props: P, path: string) => R | null): RouteDefinicationDefiner<R, I> {
		const transform = this.pathTransform;
		return new RouteDefinicationDefiner((path) => {
			const transformed = transform(path);
			if (transformed == null) {
				return null;
			}
			return mapping(transformed, path);
		}, this.toPath, this.priority);
	}
	public mapForwardDirect<R>(mapping: (path: string) => R | null, priority: number = this.priority): RouteDefinicationDefiner<R, I> {
		return new RouteDefinicationDefiner(mapping, this.toPath, priority);
	}
	public mapInverse<R>(mapping: (props: R) => I): RouteDefinicationDefiner<P, R> {
		const toPath = this.toPath;
		return new RouteDefinicationDefiner(this.pathTransform, (other) => toPath(mapping(other)), this.priority);
	}
	public mapInverseDirect<R>(mapping: (props: R) => string): RouteDefinicationDefiner<P, R> {
		return new RouteDefinicationDefiner(this.pathTransform, (other) => mapping(other), this.priority);
	}
	public mapAll<PN, IN>(mapping: (props: P, path: string) => PN | null, toPathMapping: (props: IN) => I): RouteDefinicationDefiner<PN, IN> {
		const toPath = this.toPath;
		const transform = this.pathTransform;
		return new RouteDefinicationDefiner((path) => {
			const transformed = transform(path);
			if (transformed == null) {
				return null;
			}
			return mapping(transformed, path);
		}, (props) => toPath(toPathMapping(props)), this.priority);
	}
	public exposingPath<K extends string>(key: K): RouteDefinicationDefiner<Exclude<P, K> & { [K1 in K]: string}, I> {
		return this.mapForward((props, path) => ({ ...props, [key]: path }) as Exclude<P, K> & { [K1 in K]: string});
	}
	public addPriority(change: number): this {
		this.priority += change;
		return this;
	}
	public setPriority(change: number): this {
		this.priority = change;
		return this;
	}
	public setDebugValue(debugValue: string): this {
		this.debugValue = debugValue;
		return this;
	}
	public addCondition<R extends P>(condition: (props: P) => props is R): RouteDefinicationDefiner<R, I>;
	public addCondition(condition: (props: P) => boolean): RouteDefinicationDefiner<P, I>;
	public addCondition(condition: (props: P) => boolean): RouteDefinicationDefiner<P, I> {
		return this.mapForward((props) => condition(props) ? props : null);
	}
}

export interface RouteDefinication<P, I> {
	tryRender(path: string): ((extraProps: P) => JSX.Element | null) | null;
	toPath(props: I): string;
	priority: number,
	debugValue: string,
}

type GetInverseMapping<T> = T extends ((props: infer P) => string) ? P : never;
export function customRoute<P, I extends ((props: any) => string) | null>(converter: (path: string) => P | null, inverseMapping: I, priority: number = 99999): RouteDefinicationDefiner<P, GetInverseMapping<I>> {
	return new RouteDefinicationDefiner(
		converter,
		(inverseMapping || (() => { throw new Error('toPath not provided for this custom route'); })) as (arg: GetInverseMapping<I>) => string,
		priority,
	);
}

interface RouteMatherOptions<K extends string | number | symbol = string | number | symbol> {
	readonly exact?: boolean,
	readonly lastOptional?: boolean,
	readonly tokenDoesMatchSlash?: boolean,
	readonly priorityAdjustMent?: number,
	readonly generateDebugValue?: boolean,
	readonly regexTokenProvider?: (key: K, index: number, isLast: boolean, options: RouteMatherOptions<K>) => string
}

export const DEFAULT_ROUTE_OPTIONS: Required<RouteMatherOptions> = {
	exact: false,
	lastOptional: false,
	tokenDoesMatchSlash: false,
	priorityAdjustMent: 0,
	generateDebugValue: process.env.NODE_ENV === 'development',
	regexTokenProvider(key, index, isLast, options): string {
		if (isLast && options.lastOptional) {
			return options.tokenDoesMatchSlash ? '.*' : '[^/]*';
		}
		return options.tokenDoesMatchSlash ? '.+' : '[^/]+';
	},
};

function castedDefaultRouteOptions<K extends string | number | symbol>(): Required<RouteMatherOptions<K>> {
	return DEFAULT_ROUTE_OPTIONS as unknown as Required<RouteMatherOptions<K>>;
}

function escapeRegExp(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
/**
 * Makes a route matcher based on an template string and a few options.
 *
 * For the priority calculation, any normal char in the url gets 1 point, any arg gets 0.1 points, and an exact match gets +0.001 points
 */
function makeRouteMatcher<K extends string>(
	templatePath: TemplateStringsArray,
	options: Required<RouteMatherOptions<K>>,
	args: K[],
): RouteDefinicationDefiner<{ [K1 in K]: string }, { [K1 in K]: string | number | { toString(): string } }> {
	let constructed = `^${escapeRegExp(templatePath[0])}`;
	let debugValue = `route\`${templatePath.raw[0]}`;
	let priority = templatePath[0].length + options.priorityAdjustMent;
	for (let i = 1; i < templatePath.length; i++) {
		const argIndex = i - 1;
		const isLastToken = i === templatePath.length - 1;
		constructed += `(${options.regexTokenProvider(args[argIndex], argIndex, isLastToken, options)})`;
		constructed += escapeRegExp(templatePath[i]);
		debugValue += `\${'${args[argIndex]}'}`;
		debugValue += templatePath.raw[i];
		priority += 0.1 + templatePath[i].length;
	}
	debugValue += '`; ';
	if (options.exact) {
		constructed += '$';
		priority += 0.001;
	}
	const asRegex = new RegExp(constructed);
	debugValue += asRegex;
	return customRoute(
		function pathTransform(path): { [K1 in K]: string } | null {
			const result = asRegex.exec(path);
			// console.log(path, asRegex, result)
			if (result === null) {
				return null;
			}
			return Object.fromEntries(args.map((name, index) => [name, result[index + 1]])) as unknown as { [K1 in K]: string };
		},
		function toPath(props): string {
			let path = templatePath[0];
			for (let i = 1; i < templatePath.length; i++) {
				path += props[args[i - 1]];
				path += templatePath[i];
			}
			return path;
		},
		priority,
	).setDebugValue(options.generateDebugValue ? debugValue : '');
}

interface RouteFinaliser<P, I> {
	(options?: RouteMatherOptions<keyof P>): RouteDefinicationDefiner<P, I>
}

export default function route<K extends string>(templatePath: TemplateStringsArray, ...args: K[]): RouteFinaliser<
{ [K1 in K]: string },
{ [K1 in K]: string | number | { toString(): string }}
> {
	return (options: RouteMatherOptions<K> = {}) => {
		return makeRouteMatcher(templatePath, provideDefaults<Required<RouteMatherOptions<K>>>(options, castedDefaultRouteOptions<K>()), args);
	};
}
