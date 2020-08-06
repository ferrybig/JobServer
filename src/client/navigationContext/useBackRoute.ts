import { useMemo } from 'react';
import { RouteDefinication } from '../components/minirouter/route';
import useBack from './useBack';

export default function useBackRoute<R>(route: RouteDefinication<any, R> | null, props: R) {
	const back = useMemo(() => route ? route.toPath(props) : null, [route, props]);
	useBack(back);
}
