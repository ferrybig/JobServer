import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger'
import createSagaMiddleware from 'redux-saga'
import mainSaga from '../sagas/';
import reducer from './reducer';


const sagaMiddleware = createSagaMiddleware()
const logger = createLogger({
});
const middleware = [sagaMiddleware, logger];

const store = createStore(reducer, applyMiddleware(...middleware));

sagaMiddleware.run(mainSaga).toPromise().catch((e) => {
	console.error('Unexpected error!');
	console.error(e);
	process.exit(1);
});

export default store;