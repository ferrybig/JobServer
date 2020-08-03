import React, { FC } from 'react';
import Link from './minirouter/Link';
import {tasksForDeploymentInformation} from '../routes';
import useView from '../views/useView';
import clientViews from '../views/views';
//import classes from './TaskOverview.module.css';

interface Props {
	deploymentInformationId?: string;
}

const TaskOverview: FC<Props> = ({
	deploymentInformationId
}): JSX.Element => {


	const {data, status} = deploymentInformationId ? useView(clientViews.taskList, []) : useView(clientViews.taskByDeploymentId, [], '')
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
