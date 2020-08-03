import React, { ReactNode, ReactHTML, HTMLAttributes, useCallback } from 'react';
import {contextLocation} from './LocationService';
import {RouteDefinication} from './route';

export default function Link<R>({route, props, children, tag, onClick, ...rest}: {
	route: RouteDefinication<any, R>,
	props: R,
	children: ReactNode,
	tag?: keyof ReactHTML,
} & HTMLAttributes<HTMLElement>): JSX.Element | null {
	const [update, format] = contextLocation.useUpdate();
	const path = route.toPath(props);
	const realTag = tag || 'a' as const;
	const realOnClick = useCallback((e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		if (onClick) {
			onClick(e);
		}
		if (!e.defaultPrevented) {
			e.preventDefault();
			update(path);
		}
	}, [onClick, path, update]);
	return React.createElement(realTag, {
		href: realTag === 'a' ? format(path) : undefined,
		onClick: realOnClick,
		...rest,
	}, children);
}

