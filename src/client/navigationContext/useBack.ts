import { useContext, useLayoutEffect } from 'react';
import NavigationContext from '.';

export default function useBack(path: string | null) {
	const contextValue = useContext(NavigationContext);
	useLayoutEffect(() => contextValue.setValues({ backLink: path }), [contextValue, path]);
}
