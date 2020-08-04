import { runSaga, stdChannel, RunSagaOptions } from 'redux-saga'
import mainSaga from './sagas';
import stopNodeProcessOnError from '../common/utils/stopNodeProcessOnError';

const channel = stdChannel<never>()

const myIO: RunSagaOptions<never, never> = {
	// this will be used to orchestrate take and put Effects
	channel,
	// this will be used to resolve put Effects
	dispatch(output) {
		throw new Error('[PUT] This saga is not setup with a store connection: ' + output);
	},
	// this will be used to resolve select Effects
	getState() {
		throw new Error('[SELECT] This saga is not setup with a store connection');
	},
};

runSaga(
	myIO,
	mainSaga,
).toPromise().catch(stopNodeProcessOnError);
