import React, {createContext, useState, useEffect, useContext, FC } from 'react';

export interface HookedLocationService {
	useLocationService(): string;
	useUpdate(): (path: string) => void;
}

export interface LocationService extends HookedLocationService {
	get(): string;
	subscribe(onEvent: () => void): () => void;
	update(path: string): void;
}

export function makeSimpleLocationService(service: Pick<LocationService, Exclude<keyof LocationService, 'useLocationService' | 'useUpdate'>>): LocationService {
	return {
		...service,
		useLocationService() {
			const [currentLocation, setCurrentLocation] = useState(service.get());
			useEffect(() => {
				return service.subscribe(() => {
					setCurrentLocation(service.get());
				});
			}, [setCurrentLocation]);
			return currentLocation;
		},
		useUpdate() {
			return service.update;
		}
	};
}

export const hashLocation: LocationService = makeSimpleLocationService({
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
	update(path) {
		window.location.replace(`#!${path}`);
	},
});

export const LOCATION_CONTEXT = createContext<LocationService>(hashLocation);

export const contextLocation: HookedLocationService = {
	useLocationService() {
		const service = useContext(LOCATION_CONTEXT);
		const [currentLocation, setCurrentLocation] = useState(service.get());
		useEffect(() => {
			return service.subscribe(() => {
				setCurrentLocation(service.get());
			});
		}, [setCurrentLocation]);
		return currentLocation;
	},
	useUpdate() {
		const service = useContext(LOCATION_CONTEXT);
		return service.update;
	}
}

export const LocationProvider: FC<{ service: LocationService }> = ({ service, children }) => {
	return (
		<LOCATION_CONTEXT.Provider value={service}>
			{children}
		</LOCATION_CONTEXT.Provider>
	);
}