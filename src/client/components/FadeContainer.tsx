import React, { FC, HTMLAttributes } from 'react';
import classes from './FadeContainer.module.css';

interface Props {
	renderDiv?: boolean | HTMLAttributes<HTMLDivElement>;
}

const FadeContainer: FC<Props> = ({
	children,
	renderDiv = true,
}): JSX.Element => {

	return (
		<div className={classes.root}>
			{renderDiv ? <div {...(typeof renderDiv === 'object' ? renderDiv : {})}>{children}</div> : children }
		</div>
	);
};

export default FadeContainer;
