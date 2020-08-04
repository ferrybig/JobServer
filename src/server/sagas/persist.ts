import { SagaIterator } from "redux-saga";
import { computePersistState } from "../store/selectors";
import { select, call, put, delay } from "redux-saga/effects";
import { PersistStateV1 } from "../../common/types";
import { CONFIG_PATH, CONFIG_RESET } from "../config";
import { writeFile, readFile } from "../../common/async/fs";
import { crudInit } from "../store/actions";
import { take } from "../../common/utils/effects";


function* load() {
	if (CONFIG_RESET) {
		const state: PersistStateV1 = {
			version: 'v1',
			workers: [{
				id: '111',
				currentTask: null,
			}],
			taskInformation: [{
				id: '1',
				name: 'Test task',
				buildScript: [
					'FROM mhart/alpine-node:11 AS build-stage',
					'WORKDIR /app',
					'COPY package.json .',
					'COPY package-lock.json .',
					'RUN npm install',
					'COPY . .',
					'RUN npm run client-build',
					'FROM scratch AS export-stage',
					'COPY --from=build-stage /app/build / '
				],
				buildScriptType: 'docker',
				deploymentInformationId: '1',
				sequenceId: 1,
				deploymentDir: 'output/repo_1/1/deployments/1',
				deploymentType: 'static-extract',
				deploymentInstructions: '',
				deleted: false,
				sitePath: '/ttt',
				siteId: '1',
			}, {
				id: '2',
				name: 'Frontend code',
				buildScript: [
					'FROM scratch AS export-stage',
					'COPY /src /'
				],
				buildScriptType: 'docker',
				deploymentInformationId: '2',
				sequenceId: 1,
				deploymentDir: 'output/repo_2/2/deployments/1',
				deploymentType: 'static-extract',
				deploymentInstructions: '',
				deleted: false,
				sitePath: '/test',
				siteId: '1',
			}/*, {
				id: '3',
				name: 'Frontend build',
				buildScript: [
					'FROM mhart/alpine-node:11 AS build-stage',
					'WORKDIR /app',
					'COPY package.json .',
					'COPY package-lock.json .',
					'RUN npm install',
					'COPY . .',
					'RUN npm install',
					'RUN npm run client-build',
					'FROM scratch AS export-stage',
					'COPY --from=build-stage /app/build / '
				],
				deploymentInformationId: '2',
				sequenceId: 2,
			}*/],
			task: [{
				id: '1',
				outputFile: 'output/repo_1/info_1/dep_1/task_1.tgz',
				workerId: null,
				status: 'approved',
				log: '',
				taskInformationId: '1',
				deploymentId: '1',
				startTime: 0,
				endTime: 0,
				buildTime: 0,
			}],
			repo: [{
				id: '1',
				url: 'git@github.com:ferrybig/meet-app.git',
				secret: '12345',
				outputDir: 'output/repo_1',
			},{
				id: '2',
				url: 'http://10.248.72.1:5010/.git/',
				secret: '12345',
				outputDir: 'output/repo_2',
			}],
			deploymentInformation:  [{
				id: '1',
				name: 'Master branch only',
				outputDir: 'output/repo_1/info_1',
				repoId: '1',
				pattern: 'refs/heads/master',
				deleted: false,
			}, {
				id: '2',
				name: 'Master branch only',
				outputDir: 'output/repo_2/info_2',
				repoId: '2',
				pattern: 'refs/heads/master',
				deleted: false,
			}],
			deployment:  [{
				commit: '6bb5463193f5ee9434585058c1dcd358517c35a6',
				branch: 'refs/heads/master',
				timestamp: 1,
				id: '1',
				outputDir: 'output/repo_1/info_1/dep_1',
				status: 'pending',
				deploymentInformationId: '1',
				sequenceId: 1,
				deployed: false,
			}, {
				commit: '6bb5463193f5ee9434585058c1dcd358517c35a6',
				branch: 'refs/heads/master',
				timestamp: 1,
				id: '2',
				outputDir: 'output/repo_2/info_2/dep_2',
				status: 'pending',
				deploymentInformationId: '2',
				sequenceId: 1,
				deployed: false,
			}],
			pendingFile: [],
			site: [{
				id: '1',
				name: 'localhost',
				configBlob: '',
				aliasses: [],
				ssl: 'yes',
				noSsl: 'yes',
				default: true,
				includesBefore: '1',
				includesAfter: null,
			}],
			nginxConfig: [{
				id: '1',
				name: 'Base site config',
				configBlob: '',
				includesBefore: null,
				includesAfter: null,
			}],
			platformTask: [],
		};
		yield put(crudInit(state));
		return;
	}
	try {
		const contents: string = yield call(readFile, CONFIG_PATH, 'utf-8');
		yield put(crudInit(JSON.parse(contents)));
	} catch(e) {
		console.warn(e);
		yield put(crudInit({
			workers: [],
			task: [],
			taskInformation: [],
			repo: [],
			deployment: [],
			deploymentInformation: [],
			pendingFile: [],
			site: [],
			nginxConfig: [],
			platformTask: [],
		}));
	}
}
function* save() {
	const state: PersistStateV1 = yield select(computePersistState);
	yield call(writeFile, CONFIG_PATH, JSON.stringify(state, null, 4));
}


export default function* handlePersist(): SagaIterator {
	yield call(load);
	yield call(save);
	while(true) {
		yield take(() => true);
		yield delay(1000);
		yield call(save);
	}
}
