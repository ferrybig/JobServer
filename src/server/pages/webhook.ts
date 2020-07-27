import {v4 as uuid} from 'uuid'
import {getOrNull, filter} from "../store/selectors";
import store from "../store";
import makeWebhookHandler from "../express/gh-wehbook/webhookHandler";
import assertNever from "../../common/utils/assertNever";
import {Deployment, DeploymentInformation, Task} from "../store/types";
import {join} from 'path';
import {crudPersist, crudUpdate} from '../store/actions';

function computeSequenceId(deploymetInformationId: DeploymentInformation['id'], state = store.getState()) {
	const deployments = filter(state, 'deployment', (d) => d.deploymentInformationId === deploymetInformationId);
	if (deployments.length === 0) {
		return 1;
	}
	const maxSequence = Math.max(...deployments.map(e => e.sequenceId));
	return maxSequence + 1;
}

export default makeWebhookHandler((req) => {
	const repoId = req.params.repo;
	const repo = getOrNull(store.getState(), 'repo', repoId);
	if (!repo) {
		return undefined;
	}
	return [repo.secret, repo];
}, ({
	body,
	extra: repo,
}, req, res, next) => {
	switch (body.type) {
		case 'ping':
			res.statusCode = 204;
			res.send('')
			break;
		case 'push':
			if (body.data.deleted) {
				res.statusCode = 204;
				res.send('');
				break;
			}
			const ref = body.data.ref;
			const commit = body.data.after;
			const matchedDeploymentInformations = filter(
				store.getState(),
				'deploymentInformation',
				(d) => d.repoId === repo.id && new RegExp(`^${d.pattern}$`).test(ref)
			);
			const taskIds: Task['id'][] = [];
			for (const matched of matchedDeploymentInformations) {
				const sequenceId = computeSequenceId(matched.id);
				const taskInformations = filter(store.getState(), 'taskInformation', (d) => d.deploymentInformationId === matched.id);
				if (taskInformations.length === 0) {
					console.warn('Deployment information ' + matched.id + ' has no valid tasks');
				}
				const newDeployment: Deployment = {
					id: uuid(),
					commit,
					branch: ref,
					outputDir: matched.outputDir ? join(matched.outputDir, `${sequenceId}`) : null,
					status: 'pending',
					deploymentInformationId: matched.id,
					timestamp: Date.now(),
					sequenceId,
				}
				store.dispatch(crudPersist('deployment', newDeployment));
				for (const taskInformation of taskInformations) {
					const newTask: Task = {
						id: uuid(),
						outputFile: newDeployment.outputDir ? join(newDeployment.outputDir, `${taskInformation.sequenceId}.tgz`) : null,
						workerId: null,
						status: 'init',
						log: '',
						taskInformationId: taskInformation.id,
						deploymentId: newDeployment.id,
						startTime: 0,
						buildTime: 0,
						endTime: 0,
					}
					store.dispatch(crudPersist('task', newTask));
					taskIds.push(newTask.id);
				}
			}
			// TODO Approve all tasks for now
			for (const taskId of taskIds) {
				store.dispatch(crudUpdate('task', {
					id: taskId,
					data: {
						status: 'approved',
					}
				}));
			}

			res.statusCode = 20;
			res.send('Matched deployments: ' + matchedDeploymentInformations.length);
			break;
		case '?':
			res.statusCode = 400;
			res.send('Unknown event: ' + body.originalType);
			break;
		default:
			return assertNever(body);
	}
})