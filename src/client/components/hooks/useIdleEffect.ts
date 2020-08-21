import { useEffect } from 'react';
import {requestIdleCallback} from '../../../common/dom/schedule'

export default function useIdleEffect(callback: () => void | (() => void), deps: any[]): void {
	useEffect(() => {
		return requestIdleCallback(callback);
		// The caller is responsible
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}
