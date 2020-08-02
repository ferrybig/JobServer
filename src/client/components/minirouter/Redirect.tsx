import React, { FC, useLayoutEffect } from 'react';
import classes from './Redirect.module.css';
import {contextLocation} from './LocationService';
import {RouteDefinication} from './route';

export default function Redirect<R>({route, props}: {
	route: RouteDefinication<any, R>,
	props: R,
}): JSX.Element | null {
	const update = contextLocation.useUpdate();
	useLayoutEffect(() => {
		update(route.toPath(props));
	}, [route, props]);
	return null;
}

