import React from 'react';
import route from './components/minirouter/route';
import TaskOverview from './components/TaskOverview';
import Redirect from './components/minirouter/Redirect';
import Debug from './components/Debug';

export const deploymentInformationSingle = route`/deploymentInformation/${'id'}/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
export const deploymentInformation = route`/deploymentInformation/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
export const tasksForDeploymentInformation = route`/tasks/${'deploymentInformationId'}`().component(TaskOverview);
export const taskInfo = route`/task/${'taskId'}`().render(() => null);
export const tasks = route`/tasks/`().component(TaskOverview);
export const home = route`/`({ exact: true }).render(() => <Redirect route={tasks} props={{}}/>);
export const notFound = route``().render(() => <span>Page not found</span>);
