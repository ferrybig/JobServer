import { createStore, applyMiddleware, Reducer } from 'redux';
import { createLogger } from 'redux-logger'
import createSagaMiddleware from 'redux-saga'
import mainSaga from '../sagas/';
import reducer, {State} from './reducer';
import * as actions from './actions';


const sagaMiddleware = createSagaMiddleware()
const logger = createLogger({
});
const middleware = [sagaMiddleware, logger];

const store = createStore(reducer as Reducer<State, ReturnType<(typeof actions)[keyof typeof actions]>>, applyMiddleware(...middleware));

sagaMiddleware.run(mainSaga).toPromise().catch((e) => {
	console.error('Unexpected error!');
	console.error(e);
	process.exit(1);
});

export default store;