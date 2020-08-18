import React, { FC } from 'react';
import ThemeContext, { makeThemeProvider } from './themes';
import NavigationContext, { makeNavigationContext } from './navigation';
import LocationContext, { makeHashLocationContext } from './location';
import RootThemeInjector from './themes/RootThemeInjector';

export default function setupContextProvider(): FC {
	const LocationContextValue = makeHashLocationContext();
	const NavigationContextValue = makeNavigationContext();
	const ThemeContextValue = makeThemeProvider();
	return ({ children }) => (
		<LocationContext.Provider value={LocationContextValue}>
			<NavigationContext.Provider value={NavigationContextValue}>
				<ThemeContext.Provider value={ThemeContextValue}>
					<RootThemeInjector/>
					{children}
				</ThemeContext.Provider>
			</NavigationContext.Provider>
		</LocationContext.Provider>
	);
}
