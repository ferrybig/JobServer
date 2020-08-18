import { useEffect } from 'react';
import { RouteDefinication } from './route';
import useLocation from '../../context/location/useLocation';

export default function Redirect<R>({ route, props }: {
	route: RouteDefinication<any, R>;
	props: R;
}): JSX.Element | null {
	const locationContext = useLocation();
	useEffect(() => {
		// Replace if another route interaction happened last 10 sec, else push a new frame
		locationContext.updatePath(route.toPath(props), { replace: Date.now() - locationContext.lastInteraction() < 10000 });
	}, [route, props, locationContext]);
	return null;
}
