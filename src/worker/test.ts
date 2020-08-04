import TaskRunner from './taskRunner';
import RepoAccessor from './RepoAccessor';

const repo = new RepoAccessor('/home/fernando/Documents/Dev/Private/JobServer/repos');
const taskRunner = new TaskRunner(repo);

taskRunner.run({
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
	buildScriptType: 'docker',
	repo: {
		url: 'git@github.com:ferrybig/meet-app.git',
		commit: '6bb5463193f5ee9434585058c1dcd358517c35a6',
		branch: 'master',
	},
}, '/home/fernando/Documents/Dev/Private/JobServer/output/output.tar.gz');
