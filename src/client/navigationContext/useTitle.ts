import { useContext, useLayoutEffect } from 'react';
import NavigationContext from '.';

export default function useTitle(pageName: string) {
	const contextValue = useContext(NavigationContext);
	useLayoutEffect(() => contextValue.setValues({ pageName }), [contextValue, pageName]);
}
