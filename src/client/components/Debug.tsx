import React, { FC } from 'react';

const Debug: FC<Record<string, any>> = (props) => {
	return <pre>{JSON.stringify(props, null, 4)}</pre>;
};

export default Debug;
