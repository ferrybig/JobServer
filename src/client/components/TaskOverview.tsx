import React, { FC } from 'react';
import Link from './minirouter/Link';
import {tasksForDeploymentInformation} from '../routes';
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
			slkkdkjdkjdf
			<Link route={tasksForDeploymentInformation} props={{
				deploymentInformationId: deploymentInformationId === 'TEST' ? 'HI' : 'TEST'
			}}>
				Test link.
				<code>ssss</code>
			</Link>
		</div>
	);
}

export default TaskOverview;
