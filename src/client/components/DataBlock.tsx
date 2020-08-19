import React, { FC } from 'react';
import classes from './DataBlock.module.css';

const DataBlock: FC = ({
	children
}): JSX.Element => {
	return (
		<div className={classes.root}>
			{ children }
		</div>
	);
};

export default DataBlock;

export const fadeContainerClass = classes.container;
