import {SagaIterator} from "redux-saga";
import {computePersistState} from "../store/selectors";
import {select, call, put} from "redux-saga/effects";
import {PersistState} from "../store/types";
import {CONFIG_PATH} from "../config";
import {writeFile, readFile} from "../../common/async/fs";
import {loadState} from "../store/actions";


function* load() {
	try {

		const contents: string = yield call(readFile, CONFIG_PATH, 'utf-8');
		yield put(loadState(JSON.parse(contents)))
	} catch(e) {
		console.warn(e);
		const state: PersistState = {
			workers: [{
				id: '111',
				currentTask: null,
			}],
			taskInformation: [{
				id: '1',
				buildScript: [
					'FROM mhart/alpine-node:11 AS build-stage',
					'WORKDIR /app',
					'COPY . .',
					'RUN npm install',
					'RUN npm run client-build',
					'FROM scratch AS export-stage',
					'COPY --from=build-stage /app/build / '
				],
				deploymentInformationId: '1'
			}],
			task: [{
				id: '1',
				buildScript: [
					'FROM mhart/alpine-node:11 AS build-stage',
					'WORKDIR /app',
					'COPY . .',
					'RUN npm install',
					'RUN npm run client-build',
					'FROM scratch AS export-stage',
					'COPY --from=build-stage /app/build / '
				],
				commit: '6bb5463193f5ee9434585058c1dcd358517c35a6',
				outputFile: 'output/output/repo_1/info_1/dep_1/task_1.tgz',
				workerId: null,
				status: 'approved',
				log: '',
				taskInformationId: '1',
				deploymentId: '1',
			}],
			repo: [{
				id: '1',
				url: 'git@github.com:ferrybig/meet-app.git'
			}],
			deploymentInformation:  [{
				id: '1',
				branch: 'master',
				outputDir: 'output/repo_1/info_1',
				repoId: '1'
			}],
			deployment:  [{
				id: '1',
				outputDir: 'output/repo_1/info_1/dep_1',
				status: 'pending',
				deploymentInformationId: '1'
			}],
		};
		yield put(loadState(state))
	}


}
function* save() {
	const state: PersistState = yield select(computePersistState);
	yield call(writeFile, CONFIG_PATH, JSON.stringify(state, null, 4));
}


export default function* handlePersist(): SagaIterator {
	yield call(load);
	yield call(save);
}