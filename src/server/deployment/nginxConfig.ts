class LocationBuilder {
	private output: string;

	public constructor(flags: '' |  '=' | '~' | '~*' | '^~', path: string) {
		this.output = `location ${flags} ${path} {\n`;
	}

	private append(key: string, values: (string | number)[]) {
		this.output += `\t${key} ${values.join(' ')};\n`;
	}

	public root(...args: [string]) {
		this.append('root', args);
	}

	public alias(...args: [string]) {
		this.append('alias', args);
	}

	public fastcgiPass(...args: string[]) {
		this.append('fastcgi_pass', args);
	}

	public fastcgiParam(...args: [string, string]) {
		this.append('fastcgi_param', args);
	}

	public fastcgiIndex(...args: string[]) {
		this.append('fastcgi_index', args);
	}

	public expires(...args: string[]) {
		this.append('expires', args);
	}

	public index(...args: string[]) {
		this.append('index', args);
	}

	public proxyRedirect(...args: string[]) {
		this.append('proxy-redirect', args);
	}

	public proxyPass(...args: string[]) {
		this.append('proxy-pass', args);
	}

	public proxySetHeader(...args: string[]) {
		this.append('proxy_set_header', args);
	}

	public proxyConnectTimeout(...args: [number]) {
		this.append('proxy_connect_timeout', args);
	}

	public proxySendTimeout(...args: [number]) {
		this.append('proxy_send_timeout', args);
	}

	public proxyReadTimeout(...args: [number]) {
		this.append('proxy_read_timeout', args);
	}

	public proxyBuffers(...args: string[]) {
		this.append('proxy_buffers', args);
	}

	public tryFiles(...args: string[]) {
		this.append('try_files', args);
	}

	public sendfile(...args: ['on' | 'off']) {
		this.append('sendfile', args);
	}

	public etag(...args: ['on' | 'off']) {
		this.append('etag', args);
	}

	public ifModifiedSince(...args: ['off' | 'exact' | 'before']) {
		this.append('if_modified_since', args);
	}

	public satisfy(...args: ['all' | 'any']) {
		this.append('satisfy', args);
	}

	public allow(...args: string[]) {
		this.append('allow', args);
	}

	public deny(...args: string[]) {
		this.append('deny', args);
	}

	public errorPage(...args: string[]) {
		this.append('error_page', args);
	}

	public resolverTimeout(...args: [string]) {
		this.append('resolver_timeout', args);
	}

	public resolver(...args: string[]) {
		this.append('resolver', args);
	}

	public portInRedirect(...args: ['on' | 'off']) {
		this.append('port_in_redirect', args);
	}

	public postponeOutput(...args: [number]) {
		this.append('postpone_output', args);
	}

	public readAhead(...args: [number]) {
		this.append('read_ahead', args);
	}

	public internal(...args: []) {
		this.append('internal', args);
	}

	public build(): string {
		return this.output + '}\n'
	}
}

export default function location(flags: '' |  '=' | '~' | '~*' | '^~', path: string, more: (builder: LocationBuilder) => void): string {
	const builder = new LocationBuilder(flags, path);
	more(builder);
	return builder.build();
}
