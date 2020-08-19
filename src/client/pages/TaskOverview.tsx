import React, { FC, useCallback } from 'react';
import { tasks } from '../routes';
import useView from '../views/useView';
import clientViews, { ViewData, ViewOptions } from '../views/views';
import useBack from '../context/navigation/useBack';
import useTitle from '../context/navigation/useTitle';
import OverviewList from '../components/OverviewList';
import ListItemTask from '../components/ListItemTask';
import FadeContainer from '../components/FadeContainer';
import DataBlock, { fadeContainerClass } from '../components/DataBlock';

interface Props {
	deploymentInformationId?: string;
}

const TaskOverview: FC<Props> = ({
	deploymentInformationId
}): JSX.Element => {
	useBack(deploymentInformationId ? tasks.toPath({}) : null);
	useTitle(deploymentInformationId ? 'Tasks for deployment ' + deploymentInformationId : 'All tasks');
	const wrappedView = useCallback((subscribe: (data: ViewData<typeof clientViews.taskList> | ViewData<typeof clientViews.taskListPerDeplyoment> | null) => void, options: ViewOptions): () => void => {
		if (deploymentInformationId) {
			return clientViews.taskListPerDeplyoment(subscribe, options, deploymentInformationId);
		} else {
			return clientViews.taskList(subscribe, options);
		}
	}, [deploymentInformationId]);

	const viewData = useView(wrappedView, { defaultValue: [] });

	return (
		<div >
			<FadeContainer renderDiv={{ className: fadeContainerClass }}>
				<DataBlock>
					1
				</DataBlock>
				<DataBlock>
					2
				</DataBlock>
				<DataBlock>
					3
				</DataBlock>
				<DataBlock>
					4
				</DataBlock>
				<DataBlock>
					5
				</DataBlock>
				<DataBlock>
					6
				</DataBlock>
			</FadeContainer>
			<OverviewList list={viewData} reverse item={(task) => <ListItemTask key={task.id} task={task}/>}/>
		</div>
	);
};

export default TaskOverview;
