export default function indent(main: string, indent: number | string) {
	const finalIndent = typeof indent === 'number' ? '\t'.repeat(indent) : indent;
	if (main.length === 0) {
		return '';
	}
	const split = main.split('\n');
	return split.map((e, i) => i === split.length - 1 ? e : finalIndent + e).join('\n');
}
