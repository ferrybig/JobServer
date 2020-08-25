import React from 'react';
import ReactDOM from 'react-dom';
import App, { authContext } from './App';
import * as serviceWorker from './serviceWorker';
import { UpstreamServer } from './UpstreamServer';
import { registerViewsToServer } from './views/views';

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
);

const upstreamConnection = new UpstreamServer();
authContext.registerServerHandler(upstreamConnection);
registerViewsToServer(upstreamConnection);
upstreamConnection.startConnection('ws://localhost:5000/client');

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
