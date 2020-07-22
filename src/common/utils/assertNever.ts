export default function assertNever(input: never, reason?: string): never {
	throw new Error(`Unexpected value encountered: ${JSON.stringify(input)} ${reason ? `: ${reason}` : ''}`);
}
