import React, { FC } from 'react';
//import classes from './App.module.css';
import * as routes from './routes';
import makeRouter from './components/minirouter/makeRouter';

const Router = makeRouter(Object.values(routes));

const App: FC = (): JSX.Element => {
	return (
		<Router/>
	);
};

export default App;
