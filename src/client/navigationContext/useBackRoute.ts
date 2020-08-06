import { useMemo } from 'react';
import { RouteDefinication } from '../components/minirouter/route';
import useBack from './useBack';

export default function useBackRoute<R>(route: RouteDefinication<any, R>, props: R) {
	const back = useMemo(() => route.toPath(props), [route, props]);
	useBack(back);
}
