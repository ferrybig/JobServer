import { useContext } from 'react';
import LocationContext from '.';

export default function useLocation(): LocationContext {
	return useContext(LocationContext);
}
