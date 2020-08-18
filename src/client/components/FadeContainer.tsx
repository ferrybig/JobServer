import React, { FC } from 'react';
import classes from './FadeContainer.module.css';

interface Props {
	noDiv?: boolean;
}

const FadeContainer: FC<Props> = ({
	children,
	noDiv
}): JSX.Element => {

	return (
		<div className={classes.root}>
			{noDiv ? children : <div>{children}</div> }
		</div>
	);
};

export default FadeContainer;
