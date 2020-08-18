import React, { FC, useLayoutEffect } from 'react';
import classes from './App.module.css';
import * as routes from './routes';
import makeRouter from './components/minirouter/makeRouter';
import TopBar from './components/TopBar';
import setupContextProvider from './context';

const ContextProvider = setupContextProvider();
const Router = makeRouter(Object.values(routes));

const App: FC = (): JSX.Element => {
	useLayoutEffect(() => {
		document.body.classList.add(classes.body);
		document.body.parentElement!.classList.add(classes.html);
		return () => {
			document.body.classList.remove(classes.body);
			document.body.parentElement!.classList.remove(classes.html);
		};
	}, []);

	return (
		<ContextProvider>
			<div className={classes.root}>
				<TopBar/>
				<Router/>
			</div>
		</ContextProvider>
	);
};

export default App;
