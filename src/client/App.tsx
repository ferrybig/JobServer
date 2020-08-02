import React, { FC } from 'react';
//import classes from './App.module.css';
import * as routes from './routes';
import makeRouter from './components/minirouter/makeRouter';

console.log(routes);
const Router = makeRouter(Object.values(routes));

interface Props {
//	test: string;
}

const App: FC<Props> = ({
//	test
}): JSX.Element => {

	return (
		<Router/>
	);
}

export default App;
