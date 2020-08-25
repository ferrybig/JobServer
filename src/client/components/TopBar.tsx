import React, { FC } from 'react';
import useNavigationContext from '../context/navigation/useNavigationContext';
import Link from './minirouter/Link';
import LoginIndicator from '../context/login/LoginIndicator';
import classes from './TopBar.module.css';

const TopBar: FC = (): JSX.Element => {
	const values = useNavigationContext();

	return (
		<header className={classes.root}>
			<div className={classes.header}>
				<div className={classes.backLink}>
					{values.backLink && (
						<Link path={values.backLink} className={classes.backLinkElement}>
							←
						</Link>
					)}
				</div>
				<div className={classes.title}>
					{values.pageName}
				</div>
				<div>
					<LoginIndicator/>
				</div>
			</div>
		</header>
	);
};

export default TopBar;
