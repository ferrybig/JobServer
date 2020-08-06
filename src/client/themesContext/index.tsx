import React, { FC, createContext, useMemo, useRef } from 'react';
import classes from './themes.module.css';
import { addToFollowerArray } from '../../common/utils/addToFollowerArray';
import callArray from '../../common/utils/callArray';

function themeMap<M extends Record<string, string>>(input: M): M {
	for (const [key, value] of Object.entries(input)) {
		if (!value) {
			throw new Error(`Invalid value in thememap: ${key}: ${JSON.stringify(value)}`);
		}
	}
	return input;
}

const themes = themeMap({
	light: classes.light,
});
type Themes = keyof typeof themes;
const defaultTheme: Themes = 'light'; // TODO Test using prefers dark mode

export interface ThemeContext {
	getValue(): Themes,
	getClassname(): string,
	onUpdate(follower: () => void): () => void
	setValue(theme: Themes): void
}

export const themeContext = createContext<ThemeContext>({
	getValue() {
		throw new Error('No instance of ' + themeContext.displayName + ' has been found inside the parent stack');
	},
	getClassname() {
		throw new Error('No instance of ' + themeContext.displayName + ' has been found inside the parent stack');
	},
	setValue() {
	},
	onUpdate() {
		return () => {};
	}
});

const ThemeContextProdivder: FC = ({
	children,
}): JSX.Element => {
	const currentTheme = useRef<Themes>(defaultTheme);
	const followers = useRef<(() => void)[]>([]);
	const theme = useMemo<ThemeContext>(() => ({
		getValue() {
			return currentTheme.current;
		},
		getClassname() {
			return themes[currentTheme.current];
		},
		onUpdate(follower) {
			return addToFollowerArray(followers.current, follower);
		},
		setValue(val) {
			if (currentTheme.current !== val) {
				currentTheme.current = val;
				callArray(followers.current);
			}
		},
	}), []);

	return (
		<themeContext.Provider value={theme}>
			{ children }
		</themeContext.Provider>
	);
};

export default ThemeContextProdivder;
