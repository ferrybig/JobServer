import {TaskInformation} from "../store/types";
import {DeploymentService, DeploymentData, DeploymentServiceForTask} from "./deploymentService";
import deploymentStaticExtract from "./types/serverStatic";
import assertNever from "../../common/utils/assertNever";

const map: Readonly<Record<TaskInformation['deploymentType'], DeploymentService>> = {
	"static-extract": deploymentStaticExtract
}

export function forTaskType(taskInformationType: TaskInformation['deploymentType']): DeploymentService {
	const res = map[taskInformationType];
	if (!res) {
		return assertNever(res, 'Task type ' + taskInformationType + ' not implemented');
	}
	return res;
}

export default function forData(data: DeploymentData): DeploymentServiceForTask {
	const service = forTaskType(data.taskInformation.deploymentType);
	return {
		data,
		preStart: (...args) => service.preStart(data, ...args),
		start: (...args) => service.start(data, ...args),
		stop: (...args) => service.stop(data, ...args),
		afterStop: (...args) => service.afterStop(data, ...args),
		checkStatus: (...args) => service.checkStatus(data, ...args),
		generateConfigBlob: (...args) => service.generateConfigBlob(data, ...args),
	};
}