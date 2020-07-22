import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga'
import mainSaga from '../sagas/';
import reducer from './reducer';
import storeLogger from '../../common/store/storeLogger';


const sagaMiddleware = createSagaMiddleware()
const logger = storeLogger();
const middleware = [sagaMiddleware, logger];

const store = createStore(reducer, applyMiddleware(...middleware));

sagaMiddleware.run(mainSaga).toPromise().catch((e) => {
	console.error('Unexpected error!');
	console.error(e);
	process.exit(1);
});

export default store;