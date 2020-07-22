export type Command = string
export interface StaticDeployment {
	type: 'static'
	webPath: string,
}
export interface DockerDeployment {
	type: 'docker'
	webPath: string,
	buildScript: Command[],
}
export type Deployment = StaticDeployment

export interface BuildTask {
	id: string
	buildScript: Command[],
	repo: RepoDescription,
}
export interface RepoDescription {
	url: string,
	commit: string,
	branch: string,
}
