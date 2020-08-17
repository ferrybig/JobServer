import React, { ComponentProps } from 'react';
import { RouteDefinication } from './route';
import Link from './Link';

export default function RouteLink<R>({ route, props, ...rest }: {
	route: RouteDefinication<any, R>;
	props: R;
} & Omit<ComponentProps<typeof Link>, 'path'>): JSX.Element | null {
	const path = route.toPath(props);
	return (
		<Link path={path} {...rest}/>
	);
}

