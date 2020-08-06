import { useContext, useLayoutEffect } from 'react';
import { navigationContext } from '.';

export default function useTitle(pageName: string) {
	const contextValue = useContext(navigationContext);
	useLayoutEffect(() => contextValue.setValues({ pageName }), [contextValue, pageName]);
}
