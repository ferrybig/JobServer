import React, { FC } from 'react';
import classes from './TopBar.module.css';
import { useNavigationContextValues } from '../navigationContext/useNavigationContext';
import Link from './minirouter/Link';

const TopBar: FC = (): JSX.Element => {
	const values = useNavigationContextValues();
	console.log(values);

	return (
		<header className={classes.root}>
			<div className={classes.header}>
				<div className={classes.backLink}>
					{values.backLink && (
						<Link path={values.backLink} className={classes.backLinkElement}>
							&lt;-
						</Link>
					)}
				</div>
				<div className={classes.title}>
					{values.pageName}
				</div>
			</div>
		</header>
	);
};

export default TopBar;