import React, { FC, memo } from 'react';
import classes from './ListItemTask.module.css';
import { task } from '../../common/views/types';
import ListItem from './ListItem';
import statusClasses from '../themesContext/status';
import RouteLink from './minirouter/RouteLink';
import { taskInfo } from '../routes';
import { TaskTimer } from './Timer';

interface Props {
	task: (typeof task)['examples']['short'];
}

const ListItemTask: FC<Props> = ({
	task,
}): JSX.Element => {
	return (
		<ListItem className={statusClasses[task.status]} renderRoot={(props) => <RouteLink route={taskInfo} props={{ taskId: task.id }} {...props}/>}>
			<div className={classes.title}>{task.id}</div>
			<div className={classes.subTitle}>{task.deploymentId}</div>
			<div className={classes.actions}>
				<TaskTimer task={task}/>
			</div>
			<div className={classes.status}>{task.status}</div>
		</ListItem>
	);
};

export default memo(ListItemTask);
