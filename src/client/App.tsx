import React, { FC, useLayoutEffect } from 'react';
import classes from './App.module.css';
import * as routes from './routes';
import makeRouter from './components/minirouter/makeRouter';
import TopBar from './components/TopBar';
import NavigationContext, { makeNavigationContext } from './navigationContext';
import RootThemeInjector from './themesContext/RootThemeInjector';
import ThemeContext, { makeThemeProvider } from './themesContext';

const Router = makeRouter(Object.values(routes));
const NavigationContextValue = makeNavigationContext();
const ThemeContextValue = makeThemeProvider();

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
		<NavigationContext.Provider value={NavigationContextValue}>
			<ThemeContext.Provider value={ThemeContextValue}>
				<RootThemeInjector/>
				<div className={classes.root}>
					<TopBar/>
					<Router/>
				</div>
			</ThemeContext.Provider>
		</NavigationContext.Provider>
	);
};

export default App;
