import React, { FC, ReactNode } from 'react';
import classes from './Card.module.css';

interface Props {
	children?: ReactNode,
}

const Card: FC<Props> = ({
	children,
}): JSX.Element => {

	return (
		<span className={`${classes.root}`}>
			{ children }
		</span>
	);
};

export default Card;
