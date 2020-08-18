import React, { FC, memo } from 'react';
import classes from './ListItemTask.module.css';
import { taskShort, ReturnedValueOrMore } from '../../common/views/types';
import ListItem from './ListItem';
import statusClasses from '../context/themes/status';
import RouteLink from './minirouter/RouteLink';
import { taskInfo } from '../routes';
import { TaskTimer } from './Timer';
import Card from './Card';
import useView from '../views/useView';
import clientViews from '../views/views';

interface Props {
	task: ReturnedValueOrMore<typeof taskShort>;
}

const ListItemTask: FC<Props> = ({
	task,
}): JSX.Element => {
	const { data: taskInformation } = useView(clientViews.taskInformationGet, { noSubscribe: true }, task.taskInformationId);
	const { data: deployment } = useView(clientViews.deploymentGet, { noSubscribe: true }, task.deploymentId);
	return (
		<ListItem className={statusClasses[task.status]} renderRoot={(props) => <RouteLink route={taskInfo} props={{ taskId: task.id }} {...props}/>}>
			<div className={classes.title}>#{deployment?.sequenceId}: {taskInformation?.name}</div>
			<div className={classes.subTitle}>{task.deploymentId}</div>
			<div className={classes.actions}>
				<TaskTimer task={task}/>
			</div>
			<div className={classes.status}>
				<Card>{task.status}</Card>
			</div>
		</ListItem>
	);
};

export default memo(ListItemTask);
