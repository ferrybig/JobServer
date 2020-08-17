import { Middleware } from 'redux';
import colors from 'colors/safe';

export default function storeLogger() {
	const middleWare: Middleware = (api) => {
		return (next)  => {
			return (action) => {
				const newAction = next(action);
				const { type, ...actionData } = newAction;
				const dataAsString = JSON.stringify(actionData, (key, value) => {
					if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === Array.prototype) {
						return value;
					}
					return `INSTANCE OF ${Object.getPrototypeOf(value)?.constructor.name}`;
				});
				console.log(`${colors.green('DISPATCH:')} ${colors.cyan(type)} ${colors.reset(dataAsString)}`);
				//console.dir(api.getState());
				return newAction;
			};
		};
	};
	return middleWare;
}
