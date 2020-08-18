import React, { FC, ReactNode, useMemo } from 'react';
import classes from './ListItemLoading.module.css';
import ListItem from './ListItem';

const ListItemLoading: FC = (): JSX.Element => {
	return (
		<ListItem className={`${classes.root}`} children={''}/>
	);
};

export default ListItemLoading;

export const ListItemLoadingChain: FC = () => {
	return useMemo(() => {
		let newChildren: ReactNode = undefined;
		for (let i = 0; i < 10; i++) {
			newChildren = (
				<div className={classes.fade}>
					<ListItemLoading/>
					{newChildren}
				</div>
			);
		}
		return newChildren as JSX.Element;
	}, []);
};
