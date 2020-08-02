import React, {FC, ComponentType, useState, useEffect, useMemo } from 'react';
import sortByKey from '../../../common/utils/sortByKey';
import {RouteDefinication} from './route';
import provideDefaults from '../../../common/utils/provideDefaults';

export interface SimpleLocationService {
	get(): string;
	subscribe(onEvent: () => void): () => void;
}
export interface LocationService {
	useLocationService(): string;
}

export function makeSimpleLocationService(service: SimpleLocationService): LocationService {
	return {
		useLocationService() {
			const [currentLocation, setCurrentLocation] = useState(service.get());
			useEffect(() => {
				return service.subscribe(() => {
					setCurrentLocation(service.get());
				});
			}, [setCurrentLocation]);
			return currentLocation;
		},
	};
}

export const hashLocation = makeSimpleLocationService({
	get: () => {
		const hash = window.location.hash;
		if (!hash.startsWith('#!/')) {
			return '/';
		}
		return hash.substring(2);
	},
	subscribe(onEvent) {
		window.addEventListener('hashchange', onEvent);
		return () => window.removeEventListener('hashchange', onEvent);
	},
});

function sortRoutes<R extends RouteDefinication<any, any>>(routes: R[]): R[] {
	const copy = [...routes];
	copy.sort(sortByKey('priority', false));
	return copy;
}

interface RouterOptions {
	readonly locationService?: LocationService,
	readonly autoSort?: boolean,
	readonly debug?: boolean,
}

export const DEFAULT_ROUTER_OPTIONS: Readonly<Required<RouterOptions>> = {
	locationService: hashLocation,
	autoSort: true,
	debug: process.env.NODE_ENV === 'development',
}

const NULL_RENDER_FUNC = () => null;

export default function makeRouter<R>(routes: RouteDefinication<R, any>[], options: RouterOptions = {}): ComponentType<R> {
	const finalOptions = provideDefaults(options, DEFAULT_ROUTER_OPTIONS);
	const newRoutes = finalOptions.autoSort ? sortRoutes(routes) : routes;
	return function Router(props: R): JSX.Element | null {
		if (finalOptions.debug && process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useMemo(() => newRoutes, []); // Show debug values in componentEditor
		}
		const currentLocation = finalOptions.locationService.useLocationService();
		const matchedRenderFunction = useMemo((): (props: R) => JSX.Element | null => {
			for (const route of newRoutes) {
				const matchResult = route.tryRender(currentLocation);
				if (matchResult !== null) {
					return matchResult;
				}
			}
			return NULL_RENDER_FUNC;
		}, [currentLocation])
		return matchedRenderFunction(props);
	};
}
