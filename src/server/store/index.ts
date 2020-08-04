import { createStore, applyMiddleware, Reducer } from 'redux';
import createSagaMiddleware, { Task } from 'redux-saga';
import mainSaga from '../sagas/';
import reducer, { State } from './reducer';
import * as actions from './actions';
import storeLogger from '../../common/store/storeLogger';


const sagaMiddleware = createSagaMiddleware();
const logger = storeLogger();
const middleware = [sagaMiddleware, logger];

const store = createStore(reducer as Reducer<State, ReturnType<(typeof actions)[keyof typeof actions]>>, applyMiddleware(...middleware));

export function startSagas(): Task {
	return sagaMiddleware.run(mainSaga);
};

export default store;
