import React, { ReactNode, ReactHTML, HTMLAttributes, useCallback } from 'react';
import useLocation from '../../context/location/useLocation';

export default function Link({ path, children, tag, onClick, ...rest }: {
	path: string;
	children: ReactNode;
	tag?: keyof ReactHTML;
} & HTMLAttributes<HTMLElement>): JSX.Element | null {
	const { updatePath, formatHref } = useLocation();
	const realTag = tag || 'a' as const;
	const realOnClick = useCallback((e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		if (onClick) {
			onClick(e);
		}
		if (!e.defaultPrevented) {
			e.preventDefault();
			updatePath(path);
		}
	}, [onClick, path, updatePath]);
	return React.createElement(realTag, {
		href: realTag === 'a' ? formatHref(path) : undefined,
		onClick: realOnClick,
		...rest,
	}, children);
}
