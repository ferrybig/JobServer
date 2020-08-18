import useThemeContext from './useThemeContext';
import { FC, useLayoutEffect } from 'react';

const RootThemeInjector: FC = () => {
	const [, className] = useThemeContext();
	useLayoutEffect(() => {
		document.body.classList.add(className);
		return () => {
			document.body.classList.remove(className);
		};
	}, [className]);
	return null;
};

export default RootThemeInjector;
