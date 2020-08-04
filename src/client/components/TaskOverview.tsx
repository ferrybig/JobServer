import React, { FC, useCallback } from 'react';
import Link from './minirouter/Link';
import { tasksForDeploymentInformation } from '../routes';
import useView from '../views/useView';
import clientViews, { ViewData } from '../views/views';
//import classes from './TaskOverview.module.css';

interface Props {
	deploymentInformationId?: string;
}

const TaskOverview: FC<Props> = ({
	deploymentInformationId
}): JSX.Element => {

	const wrappedView = useCallback((subscribe: (data: ViewData<typeof clientViews.taskList> | ViewData<typeof clientViews.taskByDeploymentId> | null) => void): () => void => {
		if (deploymentInformationId) {
			return clientViews.taskByDeploymentId(subscribe, deploymentInformationId);
		} else {
			return clientViews.taskList(subscribe);
		}
	}, [deploymentInformationId]);

	const { data, status } = useView(wrappedView, []);

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
};

export default TaskOverview;
