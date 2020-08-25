import React, { FC } from 'react';
import assertNever from '../../../common/utils/assertNever';
import useLoginContext from './useLoginContext';

const LoginIndicator: FC = (): JSX.Element => {
	const login = useLoginContext();
	switch (login.value.isLoggedIn) {
		case 'yes':
			return (
				<span><img src={login.value.avatarUrl} alt=""/>Logged in as {login.value.name}<a href={login.loginUrl + '/logout'}>Logout</a></span>
			);
		case 'no':
			return (
				<a href={login.loginUrl} onClick={login.doLogin}>Login with github.</a>
			);
		case 'unknown':
			return (
				<span>Loading...</span>
			);
		default:
			return assertNever(login.value.isLoggedIn);
	}
};

export default LoginIndicator;
