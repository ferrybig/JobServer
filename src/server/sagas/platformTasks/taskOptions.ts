interface SimpleAbortSignal {
	aborted: boolean;
}

export default interface TaskOptions {
	logger: (log: string) => void;
	warnings: (error: Error) => void;
	abortSignal: SimpleAbortSignal,
};;;;;;;;;;
