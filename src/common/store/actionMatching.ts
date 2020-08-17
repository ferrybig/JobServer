import { AnyAction } from 'redux';

interface SimpleActionCreator<T, A> {
	type: T;
	(...args: any): A;
}

export default function actionMatching<A>(creator: SimpleActionCreator<any, A>, matcher: (action: A) => boolean = () => true) {
	return (action: AnyAction): boolean => {
		if (action.type !== creator.type) {
			return false;
		}
		return matcher(action as unknown as A);
	};
}
