import React, { FC, useState, useEffect } from 'react';
import classes from './Timer.module.css';
import { Task } from '../../common/types';
import assertNever from '../../common/utils/assertNever';

interface Props {
	startTime: number | null;
	endTime: number | null;
	title?: string;
}

const Timer: FC<Props> = ({
	startTime,
	endTime,
	title,
}): JSX.Element | null => {
	const [elapsed, setElapsed] = useState<number>(0);
	useEffect(() => {
		if (startTime !== null && endTime === null) {
			function update() {
				const now = Date.now();
				setElapsed(now - startTime!);
			}
			update();
			const interval = window.setInterval(update, 1000);
			return () => window.clearInterval(interval);
		}
	}, [startTime, endTime]);
	if (startTime === null) {
		return null;
	}
	const timeElapsed = endTime === null ? elapsed : endTime - startTime;
	const asSec = Math.round(timeElapsed / 1000);
	const sec = asSec % 60;
	const min = Math.floor(asSec / 60);
	const formatted = timeElapsed.toLocaleString('en-us'); // Use language context here

	return (
		<span className={classes.root} title={title ? `${title}: ${formatted}ms` : `${formatted}ms`}>
			{timeElapsed < 0 ? '??:??' : `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`}
		</span>
	);
};

export default Timer;

export const TaskTimer: FC<{task: Pick<Task, 'status' | 'startTime' | 'buildTime' | 'endTime'>}> = ({ task }): JSX.Element | null => {
	switch (task.status) {
	case 'init':
	case 'approved':
	case 'cancelled':
		return null;
	case 'running':
		return <Timer startTime={task.startTime} endTime={null} title="Building"/>;
	case 'error':
	case 'timeout':
		return <Timer startTime={task.startTime} endTime={task.endTime} title="Building"/>;
	case 'uploading':
		return <>
			<Timer startTime={task.startTime} endTime={task.buildTime} title="Building"/>
			{' '}
			<Timer startTime={task.buildTime} endTime={null} title="Uploading"/>
		</>;
	case 'success':
		return <>
			<Timer startTime={task.startTime} endTime={task.buildTime} title="Building"/>
			{' '}
			<Timer startTime={task.buildTime} endTime={task.endTime} title="Uploading"/>
		</>;
	default:
		return assertNever(task.status);
	}
};
