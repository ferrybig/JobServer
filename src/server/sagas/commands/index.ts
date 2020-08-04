import { call } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import CommandSender from "./CommandSender";
import commandNotFound from './commandNotFound';
import commandHelp from './commandHelp';
import commandTriggerPlatformTask from "./commandTriggerPlatformTask";
import CommandExecutor from "./CommandExecutor";

const notFound: CommandExecutor = commandNotFound;
const commands: Record<string, CommandExecutor> = {
	help: commandHelp,
	triggerPlatformTask: commandTriggerPlatformTask,
};

export default function* executeCommand(sender: CommandSender, parsed: string[]): SagaIterator<void> {
	const executor = commands[parsed[0]] || notFound;
	yield call(executor, sender, parsed, commands);
}
