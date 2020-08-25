import { createContext } from 'react';
import subscriptionDebug from '../../../common/utils/subscriptionDebug';
import makeContextFollowers from '../../../common/utils/makeContextFollowers';
import classes from './themes.module.css';

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
	getValue(): Themes;
	getClassname(): string;
	onUpdate(follower: () => void): () => void;
	setValue(theme: Themes): void;
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
	const { onUpdate, doUpdate } = makeContextFollowers();
	const value: ThemeContext = {
		getValue() {
			return currentTheme;
		},
		getClassname() {
			return themes[currentTheme];
		},
		onUpdate,
		setValue(val) {
			if (currentTheme !== val) {
				currentTheme = val;
				doUpdate();
			}
		},
	};
	if (process.env.NODE_ENV === 'development') {
		value.onUpdate(subscriptionDebug(ThemeContext.displayName, () => value.getValue()));
	}
	return value;
}

export default ThemeContext;
