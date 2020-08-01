import React, {FC, ComponentType, useState, useEffect, useMemo } from 'react';

class RouteDefinicationDefiner<P, I> {
	private pathTransform: (path: string) => P | null;
	public readonly toPath: (path: I) => string;
	public constructor(pathTransform: (path: string) => P | null, toPath: (path: I) => string) {
		this.pathTransform = pathTransform;
		this.toPath = toPath;
	}
	public component<C = P>(Component: ComponentType<C>): RouteDefinication<Pick<C, Exclude<keyof C, keyof P>>, I> {
		return this.render<C>((props) => <Component {...props}/>);
	}
	public render<C = P>(render: (props: C) => null | JSX.Element): RouteDefinication<Pick<C, Exclude<keyof C, keyof P>>, I> {
		const transform = this.pathTransform;
		const toPath = this.toPath;
		return {
			tryRender(path, extraProps) {
				const converted = transform(path);
				if (converted) {
					return render({
						...extraProps,
						...converted,
					} as unknown as C);
				}
				return undefined;
			},
			toPath,
		};
	}
	public mapForward<R>(mapping: (props: P, path: string) => R): RouteDefinicationDefiner<R, I> {
		const transform = this.pathTransform;
		return new RouteDefinicationDefiner((path) => {
			const transformed = transform(path);
			if (transformed == null) {
				return null;
			}
			return mapping(transformed, path)
		}, this.toPath);
	}
	public mapForwardDirect<R>(mapping: (path: string) => R): RouteDefinicationDefiner<R, I> {
		return new RouteDefinicationDefiner(mapping, this.toPath);
	}
	public mapInverse<R>(mapping: (props: R) => I): RouteDefinicationDefiner<P, R> {
		const toPath = this.toPath;
		return new RouteDefinicationDefiner(this.pathTransform, (other) => toPath(mapping(other)));
	}
	public mapInverseDirect<R>(mapping: (props: R) => string): RouteDefinicationDefiner<P, R> {
		return new RouteDefinicationDefiner(this.pathTransform, (other) => mapping(other));
	}
	public mapAll<PN, IN>(mapping: (props: P, path: string) => PN, toPathMapping: (props: IN) => I): RouteDefinicationDefiner<PN, IN> {
		const toPath = this.toPath;
		const transform = this.pathTransform;
		return new RouteDefinicationDefiner((path) => {
			const transformed = transform(path);
			if (transformed == null) {
				return null;
			}
			return mapping(transformed, path)
		}, (props) => toPath(toPathMapping(props)));
	}
}

interface RouteDefinication<P, I> {
	tryRender(path: string, extraProps: P): undefined | JSX.Element | null;
	toPath(props: I): string;
}

type GetInverseMapping<T> = T extends ((props: infer P) => string) ? P : never;
export function customRoute<P, I extends ((props: any) => string) | undefined>(converter: (path: string) => P | null, inverseMapping: I): RouteDefinicationDefiner<P, GetInverseMapping<I>> {
	return new RouteDefinicationDefiner(converter, (inverseMapping || (() => { throw new Error('toPath not provides for this custom route'); })) as (arg: GetInverseMapping<I>) => string);
}

interface RouteMatherOptions {
	exact?: boolean,
	lastOptional?: boolean,
	tokenDoesMatchSlash?: boolean,
}

function escapeRegExp(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function makeRouteMatcher<K extends string>(templatePath: TemplateStringsArray, options: Required<RouteMatherOptions>, args: K[]): {
	pathTransform(path: string): { [K1 in K]: string } | null,
	toPath(props: { [K1 in K]: string | number | { toString(): string } }): string;
} {
	const tokenArea = options.tokenDoesMatchSlash ? '.+' : '[^/]+';
	const tokenAreaOptional = options.tokenDoesMatchSlash ? '.*' : '[^/]*';
	let constructed = '^' + escapeRegExp(templatePath[0]);
	for (let i = 1; i < templatePath.length; i++) {
		constructed += '(';
		if (i === templatePath.length - 1 && options.lastOptional) {
			constructed += tokenAreaOptional;
		} else {
			constructed += tokenArea;
		}
		constructed += ')';
		constructed += templatePath[i];
	}
	if (options.exact) {
		constructed += '$';
	}
	const asRegex = new RegExp(constructed);
	return {
		pathTransform(path): { [K1 in K]: string } | null {
//			const parsedProps = Object.fromEntries(args.map(e => [e, ''])) as unknown as { [K1 in K]: string };
//			let parseIndex = 0;
//			for (let i = 0; i < templatePath.length; i++) {
//				const indexOfSection = path.indexOf(templatePath[i]);
//				if (i === 0 && indexOfSection !== 0) {
//					return null; // The first section should always start at index 0;
//				}
//				if (i !== 0) {
//					// Take 1 key of the props
//					const newKey = args[i - 1];
//					parsedProps[newKey] = path.substring()
//				}
//				parseIndex += indexOfSection;
//
//			}
			const result = asRegex.exec(path);
			if (result === null) {
				return null;
			}
			return Object.fromEntries(args.map((name, index) => [name, result[index + 1]])) as unknown as { [K1 in K]: string };
		},
		toPath(props): string {
			let path = templatePath[0];
			for (let i = 1; i < templatePath.length; i++) {
				path += props[args[i - 1]];
				path += templatePath[i];
			}
			return path;
		}
	}
}

interface RouteFinaliser<P, I> {
	(options?: RouteMatherOptions): RouteDefinicationDefiner<P, I>
}

export function route<K extends string>(templatePath: TemplateStringsArray, ...args: K[]): RouteFinaliser<
	{ [K1 in K]: string },
	{ [K1 in K]: string | number | { toString(): string }}
> {
	return (options: RouteMatherOptions = {})  => {
		const {pathTransform, toPath} = makeRouteMatcher(templatePath, {
			exact: options.exact === undefined ? false : options.exact,
			lastOptional: options.lastOptional === undefined ? false : options.lastOptional,
			tokenDoesMatchSlash: options.tokenDoesMatchSlash === undefined ? false : options.tokenDoesMatchSlash,
		}, args)
		return customRoute(pathTransform, toPath);
	}
}

export interface LocationService {
	get(): string;
	subscribe(onEvent: () => void): () => void;
}

const hashLocation: LocationService = {
	get: () => window.location.hash,
	subscribe(onEvent) {
		window.addEventListener('hashchange', onEvent);
		return () => window.removeEventListener('hashchange', onEvent);
	}
}

export default function makeRouter<R extends RouteDefinication<any, any>[]>(routes: R, locationService: LocationService = hashLocation): ComponentType<Parameters<R[number]['tryRender']>[1]> {
	return function Router(props: Parameters<R[number]['tryRender']>[1]): JSX.Element | null {
		const [currentLocation, setCurrentLocation] = useState(locationService.get());
		useEffect(() => {
			return locationService.subscribe(() => {
				setCurrentLocation(locationService.get());
			});
		}, [setCurrentLocation]);
		for(const route of routes) {
			const matchResult = route.tryRender(currentLocation, props);
			if (matchResult !== undefined) {
				return matchResult;
			}
		}
		return null;
	};
}
