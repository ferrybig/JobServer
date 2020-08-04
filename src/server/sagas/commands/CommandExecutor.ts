import { SagaIterator } from "redux-saga";
import CommandSender from "./CommandSender";

export default interface CommandExecutor {
	(sender: CommandSender, parsed: string[], registeredCommands: Record<string, CommandExecutor>): SagaIterator<void> | void | Promise<void>;
	description?: string,
	// eslint-disable-next-line semi
}
