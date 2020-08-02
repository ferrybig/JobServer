import React, { FC } from 'react';
//import classes from './TaskOverview.module.css';

interface Props {
	deploymentInformationId?: string;
}

const TaskOverview: FC<Props> = ({
	deploymentInformationId
}): JSX.Element => {

	return (
		<div >
			{ deploymentInformationId }
		</div>
	);
}

export default TaskOverview;
