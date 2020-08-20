import React, { FC } from 'react';
import classes from './TopBar.module.css';
import useNavigationContext from '../context/navigation/useNavigationContext';
import Link from './minirouter/Link';

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
					<a href="http://localhost:5000/login/">Login</a>
				</div>
			</div>
		</header>
	);
};

export default TopBar;
