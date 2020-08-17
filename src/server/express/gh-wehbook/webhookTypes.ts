/* eslint-disable @typescript-eslint/no-empty-interface */
export interface Hook {
}
export interface User {
	name: string;
	email: string;
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;


}

export interface Repository {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	private: boolean;
	owner: User;
	description: string | null;
	fork: boolean;
	url: string;
	html_url: string;
	git_url: string;
	ssh_url: string;
	http_url: string;
	'svn_url': string;
	'homepage': string | null;
	'size': number;
	'stargazers_count': number;
	'watchers_count': number;
	'language': string;
	'has_issues': boolean;
	'has_projects': boolean;
	'has_downloads': boolean;
	'has_wiki': boolean;
	'has_pages': boolean;
	'forks_count': number;
	'mirror_url': null | string;
	'archived': boolean;
	'disabled': boolean;
	'open_issues_count': number;
	'license': null | string;
	'forks': number;
	'open_issues': number;
	'watchers': number;
	'default_branch': string;
	'stargazers': number;
	'master_branch': string;
}

export interface Organization {
}

export interface Instalation {
}

export interface GitUser {
	name: string;
	email: string;
}

export interface Commit {
	sha: string;
	message: string;
	author: GitUser;
	url: string;
	distinct: boolean;
}

export interface UnknownWebhook {
	type: '?';
	data: {
		action?: string;
		repository: Repository;
		organization: Organization;
		installation?: Instalation;
		sender: User;
	};
	originalType: string;
}
export interface PingWebhook {
	type: 'ping';
	data: {
		zen: string;
		hook_id: number;
		hook: Hook;

		repository: Repository;
		organization: Organization;
		installation?: Instalation;
		sender: User;
	};
}
export interface PushWebhook {
	type: 'push';
	data: {
		created: boolean;
		deleted: boolean;
		forced: boolean;
		base_ref: null;
		compare: string;
		head_commit: string;
		ref: string;
		before: string;
		after: string;
		commits: Commit[];
		pusher: GitUser;

		repository: Repository;
		organization: Organization;
		installation?: Instalation;
		sender: User;
	};
}
export type Webhook = UnknownWebhook | PingWebhook | PushWebhook;
