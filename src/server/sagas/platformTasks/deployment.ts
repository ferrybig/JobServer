import { PlatformTask } from "../../../common/types";
import TaskOptions from "./taskOptions";
import { State } from "../../store/reducer";
import store from "../../store";
import DeploymentRunner from "../../deployment/deploymentRunner";
import { computeDeployment } from "../../store/selectors";
import { StrictEffect, all, put } from "redux-saga/effects";
import { crudUpdate } from "../../store/actions";

const runner = new DeploymentRunner();

export default async function handleDeploymentTask(data: PlatformTask & {type: 'deployment'}, options: TaskOptions, state: Pick<State, 'deployment' | 'task' | 'taskInformation' | 'deploymentInformation' | 'site' | 'nginxConfig'> = store.getState()): Promise<StrictEffect> {
	const plan = computeDeployment(state);
	options.logger('Deploying plan:\n');
	options.logger('Old length: ' + plan.existingSituation.length + '\n');
	options.logger('New length: ' + plan.newSituation.length + ' \n');
	options.logger('To create: ' + plan.toCreate.map(e => e.task.id).join(', ') + '\n');
	options.logger('To delete: ' + plan.toDelete.map(e => e.task.id).join(', ') + '\n');
	await runner.run(plan, state, options);
	const toCreate = new Set<string>(plan.toCreate.map(e => e.deployment.id));
	const toDelete = new Set<string>(plan.toDelete.map(e => e.deployment.id));
	return all([
		...[...toCreate.values()].map(id => put(crudUpdate('deployment', {
			id,
			data: {
				deployed: true,
			},
		}))),
		...[...toDelete.values()].map(id => put(crudUpdate('deployment', {
			id,
			data: {
				deployed: false,
			},
		}))),
	]);
}
