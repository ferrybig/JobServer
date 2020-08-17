import React, { FC, ReactNode, HTMLAttributes } from 'react';
import classes from './ListItem.module.css';

interface ChildrenProps {
	className: string;
	children: ReactNode;
}

interface Props {
	children: ReactNode;
	className?: string;
	renderRoot?: (props: ChildrenProps & HTMLAttributes<HTMLElement>) => JSX.Element | null;
}

function DefaultRootRenderer({ className, children, ...rest }: ChildrenProps & HTMLAttributes<HTMLElement>): JSX.Element | null {
	return (
		<div className={className} {...rest}>
			{ children }
		</div>
	);
}

const ListItem: FC<Props & HTMLAttributes<HTMLElement>> = ({
	children,
	className,
	renderRoot,
	...rest
}): JSX.Element | null => {
	const subRenderer = renderRoot || DefaultRootRenderer;

	return subRenderer({
		className: className ? `${className} ${classes.root}` : classes.root,
		children,
		...rest,
	});
};

export default ListItem;
