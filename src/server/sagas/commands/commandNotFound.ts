import CommandSender from "./CommandSender";

export default function commandNotFound(sender: CommandSender, [command]: string[]): void {
	sender.sendMessage(`Command ${command} is not found`)
}
