import React from 'react';
import classes from './OverviewList.module.css';
import { UseView } from '../views/useView';
import assertNever from '../../common/utils/assertNever';
import { ListItemLoadingChain } from './ListItemLoading';

interface Props<I> {
	list: UseView<I[], any>;
	item: (item: I) => JSX.Element | null;
	hideNotFound?: boolean;
	reverse?: boolean;
}

function mapList<I, O>(list: I[], map: (input: I, index: number, list: I[]) => O, reverse: boolean) {
	if (reverse) {
		const output: O[] = [];
		for (let i = list.length - 1; i >= 0; i--) {
			output.push(map(list[i], i, list));
		}
		return output;
	}
	return list.map(map);
}

const OverviewList = <I,>({
	list,
	item,
	hideNotFound,
	reverse,
}: Props<I>): JSX.Element => {
	switch (list.status) {
		case 'loading':
			return (
				<div className={classes.list}>
					<ListItemLoadingChain/>
				</div>
			);
		case 'success':
			return (
				<div className={classes.list}>
					{mapList(list.data, item, !!reverse)}
				</div>
			);
		case 'not-found':
			return (
				<div className={classes.list}>
					<div className={classes.listItemLoaded}/>
					<div className={classes.listItemLoaded}/>
					<div className={classes.listItemLoaded}/>
					<div className={classes.listItemLoaded}/>
					{!hideNotFound && (
						<div className={classes.notFound}>
							This item cannot be found!
						</div>
					)}
				</div>
			);
		default:
			return assertNever(list);
	}
};

export default OverviewList;
