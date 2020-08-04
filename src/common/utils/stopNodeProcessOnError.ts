export default function stopNodeProcessOnError(error: any) {
	console.error('An unexpected error happened, and the process is being closed to prevent malfunctions');
	console.error(error);
	return process.exit(1);
}
