import React from 'react';
import route from "./components/minirouter/route";
import TaskOverview from './components/TaskOverview';

function Debug(props: Record<string, any>) {
	return <pre>{JSON.stringify(props, null, 4)}</pre>;
}

export const deploymentInformationSingle = route`/deploymentInformation/${'id'}/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
export const deploymentInformation = route`/deploymentInformation/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
export const tasksForDeploymentInformation = route`/tasks/${'deploymentInformationId'}`().component(TaskOverview);
export const tasks = route`/tasks/`().component(TaskOverview);
export const home = route`/`().component(() => <span>home</span>);

