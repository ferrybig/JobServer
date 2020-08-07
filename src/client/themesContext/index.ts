import { createContext } from 'react';
import classes from './themes.module.css';
import { addToFollowerArray } from '../../common/utils/addToFollowerArray';
import callArray from '../../common/utils/callArray';
import subscriptionDebug from '../../common/utils/subscriptionDebug';

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

interface ThemeContext {
	getValue(): Themes,
	getClassname(): string,
	onUpdate(follower: () => void): () => void
	setValue(theme: Themes): void
}

const ThemeContext = createContext<ThemeContext>({
	getValue() {
		throw new Error('No instance of ' + ThemeContext.displayName + ' has been found inside the parent stack');
	},
	getClassname() {
		throw new Error('No instance of ' + ThemeContext.displayName + ' has been found inside the parent stack');
	},
	setValue() {
	},
	onUpdate() {
		return () => {};
	}
});
if (process.env.NODE_ENV === 'development') {
	ThemeContext.displayName = 'ThemeContext';
}

export function makeThemeProvider(): ThemeContext {
	let currentTheme: Themes = defaultTheme;
	const followers: (() => void)[] = [];
	const value: ThemeContext = {
		getValue() {
			return currentTheme;
		},
		getClassname() {
			return themes[currentTheme];
		},
		onUpdate(follower) {
			return addToFollowerArray(followers, follower);
		},
		setValue(val) {
			if (currentTheme !== val) {
				currentTheme = val;
				callArray(followers);
			}
		},
	};
	if (process.env.NODE_ENV === 'development') {
		value.onUpdate(subscriptionDebug(ThemeContext.displayName, () => value.getValue()));
	}
	return value;
}

export default ThemeContext;
