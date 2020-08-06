import { useContext, useLayoutEffect } from 'react';
import { navigationContext } from '.';

export default function useBack(path: string) {
	const contextValue = useContext(navigationContext);
	useLayoutEffect(() => contextValue.setValues({ backLink: path }), [contextValue, path]);
}
