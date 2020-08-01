import CommandSender from "./CommandSender";
import CommandExecutor from "./CommandExecutor";

export default function commandHelp(sender: CommandSender, _: string[], registeredCommands: Record<string, CommandExecutor>): void {
	sender.sendMessage('Help information:');
	const entries = Object.entries(registeredCommands);
	const longest = entries.reduce((a, b): number => Math.max(a, b[0].length), 0);
	for (const [key, value] of entries) {
		sender.sendMessage(` ${key}:${' '.repeat(longest - key.length)} ${value.description || '.'}`);
	}
}
commandHelp.description = 'Shows this help menu'
