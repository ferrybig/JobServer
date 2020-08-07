import React, { FC, useCallback } from 'react';
import { tasksForDeploymentInformation, tasks } from '../routes';
import useView from '../views/useView';
import clientViews, { ViewData } from '../views/views';
import RouteLink from './minirouter/RouteLink';
import useBack from '../navigationContext/useBack';
import useTitle from '../navigationContext/useTitle';
import OverviewList from './OverviewList';
import ListItemTask from './ListItemTask';
//import classes from './TaskOverview.module.css';

interface Props {
	deploymentInformationId?: string;
}

const TaskOverview: FC<Props> = ({
	deploymentInformationId
}): JSX.Element => {
	useBack(deploymentInformationId ? tasks.toPath({}) : null);
	useTitle(deploymentInformationId ? 'Tasks for deployment ' + deploymentInformationId : 'All tasks');
	const wrappedView = useCallback((subscribe: (data: ViewData<typeof clientViews.taskList> | ViewData<typeof clientViews.taskByDeploymentId> | null) => void): () => void => {
		if (deploymentInformationId) {
			return clientViews.taskByDeploymentId(subscribe, deploymentInformationId);
		} else {
			return clientViews.taskList(subscribe);
		}
	}, [deploymentInformationId]);

	const viewData = useView(wrappedView, []);

	return (
		<div >
			{ deploymentInformationId }
			slkkdkjdkjdf
			<RouteLink route={tasksForDeploymentInformation} props={{
				deploymentInformationId: deploymentInformationId === 'TEST' ? 'HI' : 'TEST'
			}}>
				Test link.
				<code>ssss</code>
			</RouteLink>
			<OverviewList list={viewData} item={(task) => <ListItemTask key={task.id} task={task}/>}/>
		</div>
	);
};

export default TaskOverview;
