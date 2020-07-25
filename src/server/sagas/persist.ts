import {SagaIterator} from "redux-saga";
import {computePersistState} from "../store/selectors";
import {select, call, put} from "redux-saga/effects";
import {PersistState} from "../store/types";
import {CONFIG_PATH} from "../config";
import {writeFile, readFile} from "../../common/async/fs";
import {crudInit} from "../store/actions";


function* load() {
	try {

		const contents: string = yield call(readFile, CONFIG_PATH, 'utf-8');
		yield put(crudInit(JSON.parse(contents)))
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
			}, {
				id: '2',
				buildScript: [
					'FROM scratch AS export-stage',
					'COPY /src /'
				],
				deploymentInformationId: '2'
			}],
			task: [{
				id: '1',
				outputFile: 'output/output/repo_1/info_1/dep_1/task_1.tgz',
				workerId: null,
				status: 'approved',
				log: '',
				taskInformationId: '1',
				deploymentId: '1',
			}, {
				id: '2',
				outputFile: 'output/output/repo_2/info_2/dep_2/task_2.tgz',
				workerId: null,
				status: 'approved',
				log: '',
				taskInformationId: '2',
				deploymentId: '2',
			}],
			repo: [{
				id: '1',
				url: 'git@github.com:ferrybig/meet-app.git'
			},{
				id: '2',
				url: 'http://10.248.72.1:5010/.git/'
			}],
			deploymentInformation:  [{
				id: '1',
				branch: 'master',
				outputDir: 'output/repo_1/info_1',
				repoId: '1'
			}, {
				id: '2',
				branch: 'master',
				outputDir: 'output/repo_2/info_2',
				repoId: '2'
			}],
			deployment:  [{
				commit: '6bb5463193f5ee9434585058c1dcd358517c35a6',
				id: '1',
				outputDir: 'output/repo_1/info_1/dep_1',
				status: 'pending',
				deploymentInformationId: '1'
			}, {
				commit: '6bb5463193f5ee9434585058c1dcd358517c35a6',
				id: '2',
				outputDir: 'output/repo_2/info_2/dep_2',
				status: 'pending',
				deploymentInformationId: '2'
			}],
			pendingFiles: [],
		};
		yield put(crudInit(state))
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