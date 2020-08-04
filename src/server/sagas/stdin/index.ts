import { SagaIterator, EventChannel, eventChannel, END } from 'redux-saga';
import { call, take } from 'redux-saga/effects';
import executeCommand from '../commands';
import CommandSender from '../commands/CommandSender';

function createChannel(): EventChannel<string[]> {
	return eventChannel<string[]>((emit) => {
		process.stdin.setEncoding('utf-8');
		let buff = '';
		function emitLine(line: string) {
			const trimmed = line.trim();
			if (trimmed.length > 0) {
				emit(trimmed.split(' ')); // TODO: smarter readline system
			}
		}
		function onData(data: Buffer) {
			buff += data;
			const lines = buff.split(/[\r\n|\n]/);
			buff = lines.pop()!;
			lines.forEach(emitLine);
		}
		function onEnd() {
			if (buff.length > 0) emitLine(buff);
			emit(END);
		}

		process.stdin.on('data', onData);
		process.stdin.on('end', onEnd);

		return () => {
			process.stdin.off('data', onData);
			process.stdin.off('end', onEnd);
		};
	});
}

function makeConsoleCommandSender(): CommandSender {
	return {
		sendMessage(message) {
			console.log(`> ${message}`);
		}
	};
}

export default function* stdinReader(): SagaIterator {
	const sender: CommandSender = yield call(makeConsoleCommandSender);
	const channel: EventChannel<string[]> = yield call(createChannel);
	while(true) {
		const parsed: string[] = yield take(channel);
		yield call(executeCommand, sender, parsed);
	}
}
