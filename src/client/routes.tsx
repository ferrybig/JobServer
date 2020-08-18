import React from 'react';
import route from './components/minirouter/route';
import Redirect from './components/minirouter/Redirect';
import Debug from './components/Debug';
import TaskOverview from './pages/TaskOverview';
import NotFound from './pages/NotFound';

export const deploymentInformationSingle = route`/deploymentInformation/${'id'}/`().render(Debug);
export const deploymentInformation = route`/deploymentInformation/`().render(Debug);
export const tasksForDeploymentInformation = route`/tasks/${'deploymentInformationId'}`().component(TaskOverview);
export const taskInfo = route`/task/${'taskId'}`().render(Debug);
export const tasks = route`/tasks/`().component(TaskOverview);
export const home = route`/`({ exact: true }).render(() => <Redirect route={tasks} props={{}}/>);
export const notFound = route``().component(NotFound);
