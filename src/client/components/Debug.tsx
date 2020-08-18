import React, { FC } from 'react';

const Debug: FC<Record<string, any>> = (props, ...rest) => {
	return <pre>{JSON.stringify(props, null, 4)}{rest.length > 0 ? `\n${JSON.stringify(rest, null, 4)}` : ''}</pre>;
};

export default Debug;
