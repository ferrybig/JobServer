import { FC, useRef } from 'react';
import useLocationState from './useLocationState';
import { useStatelessInlineSaga, wait } from '../../components/hooks/useInlineSaga';

interface ScrollOffset {
	path: string;
	scrollY: number;
	scrollX: number;
}

const scrollingElement = document.scrollingElement ?? document.body;

function scrollToOffset(currentOffset: ScrollOffset) {
	scrollingElement.scroll({
		left: currentOffset.scrollX,
		top: currentOffset.scrollY,
		behavior: 'auto',
	});
}

const ScrollRestorationHandler: FC = (): null => {
	const locationState = useLocationState();
	const scrollOffsets = useRef<(ScrollOffset | undefined)[]>([]);
	useStatelessInlineSaga(function*() {
		const { path, historyIndex } = locationState;
		if (!scrollOffsets.current[historyIndex] || scrollOffsets.current[historyIndex]!.path !== path) {
			// Record new entry
			scrollOffsets.current[historyIndex] = {
				path,
				scrollX: 0,
				scrollY: 0,
			};
			if (scrollOffsets.current.length > historyIndex + 1) {
				scrollOffsets.current.length = historyIndex + 1;
			}
		}
		const currentOffset = scrollOffsets.current[historyIndex];
		if (!currentOffset) {
			return;
		}
		scrollToOffset(currentOffset);
		let lastX = scrollingElement.scrollLeft;
		let lastY = scrollingElement.scrollTop;
		while (lastX !== currentOffset.scrollX || lastY !== currentOffset.scrollY) {
			yield wait(200);
			if (lastX !== scrollingElement.scrollLeft || lastY !== scrollingElement.scrollTop) {
				break; // User scrolled, abort this loop
			}
			// Try scrolling again
			scrollToOffset(currentOffset);
			lastX = scrollingElement.scrollLeft;
			lastY = scrollingElement.scrollTop;
		}
		return () => {
			scrollOffsets.current[historyIndex] = {
				path,
				scrollX: scrollingElement.scrollLeft,
				scrollY: scrollingElement.scrollTop,
			};
		};
	}, [locationState, scrollOffsets]);
	return null;
};

export default ScrollRestorationHandler;
