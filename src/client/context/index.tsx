import React, { FC } from 'react';
import ThemeContext, { makeThemeProvider } from './themes';
import NavigationContext, { makeNavigationContext } from './navigation';
import LocationContext, { makeHashLocationContext } from './location';
import AuthContext, { makeAuthContext } from './login/';
import RootThemeInjector from './themes/RootThemeInjector';
import ScrollRestorationHandler from './location/ScrollRestorationHandler';

export default function setupContextProvider(): { ContextProvider: FC; authContext: AuthContext } {
	const locationContextValue = makeHashLocationContext();
	const navigationContextValue = makeNavigationContext();
	const themeContextValue = makeThemeProvider();
	const authContext = makeAuthContext('http://localhost:5000/login');
	return {
		ContextProvider: ({ children }) => (
			<AuthContext.Provider value={authContext}>
				<LocationContext.Provider value={locationContextValue}>
					<NavigationContext.Provider value={navigationContextValue}>
						<ThemeContext.Provider value={themeContextValue}>
							<ScrollRestorationHandler/>
							<RootThemeInjector/>
							{children}
						</ThemeContext.Provider>
					</NavigationContext.Provider>
				</LocationContext.Provider>
			</AuthContext.Provider>
		),
		authContext,
	};
}
