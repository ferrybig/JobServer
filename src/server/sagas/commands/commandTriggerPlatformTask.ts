import CommandSender from './CommandSender';
import { SagaIterator } from 'redux-saga';
import { PlatformTask } from '../../../common/types';
import stringInListChecker from '../../../common/utils/stringInListChecker';
import { put } from 'redux-saga/effects';
import { triggerPlatformTask } from '../../store/actions';

const isValidType = stringInListChecker<PlatformTask['type']>({
	deployment: true,
});

export default function* commandTriggerPlatformTask(sender: CommandSender, [command, arg1]: string[]): SagaIterator<void> {
	if (!arg1) {
		sender.sendMessage(`Usage: ${command} ${isValidType.types.join('|')}`);
		return;
	}
	if (isValidType(arg1)) {
		sender.sendMessage(`Triggering platform task ${arg1}...`);
		yield put(triggerPlatformTask(arg1));
	} else {
		sender.sendMessage(`Arg 1 should be one of: ${isValidType.types.join('|')}`);
	}
}
commandTriggerPlatformTask.description = 'Triggers the execution of a platform task';
