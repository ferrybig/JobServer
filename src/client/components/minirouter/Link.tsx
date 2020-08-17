import React, { ReactNode, ReactHTML, HTMLAttributes, useCallback } from 'react';
import { contextLocation } from './LocationService';

export default function Link({ path, children, tag, onClick, ...rest }: {
	path: string;
	children: ReactNode;
	tag?: keyof ReactHTML;
} & HTMLAttributes<HTMLElement>): JSX.Element | null {
	const [update, format] = contextLocation.useUpdate();
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
