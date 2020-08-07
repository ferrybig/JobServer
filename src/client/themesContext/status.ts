import {Task, Deployment, PlatformTask} from "../../common/types";
import classes from './statusModule/status.module.css';

const statusClasses: Record<Task['status'] | Deployment['status'] | PlatformTask['status'], string> = {
	init: classes.init,
	approved: classes.approved,
	running: classes.running,
	uploading: classes.uploading,
	success: classes.success,
	error: classes.error,
	timeout: classes.timeout,
	cancelled: classes.cancelled,
	pending: classes.pending,
}
if (process.env.NODE_ENV === 'development') {
	for(const [key, value] of Object.entries(statusClasses)) {
		if(!value) {
			console.error('statusClasses[' + key + '] == falsy')
		}
	}
}
export default statusClasses;