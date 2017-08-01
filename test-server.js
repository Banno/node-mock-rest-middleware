#!/usr/bin/env node
'use strict';

const defaultOpts = {
	default: {
		port: 8080
	}
};

const connect = require('connect');
const opts = require('minimist')(process.argv.slice(2), defaultOpts);
const path = require('path');

if (opts._.length === 0) {
	/* eslint-disable no-console */
	console.log('Usage: ' + path.basename(process.argv[1]) + ' mockModule1 [mockModule2 ...] [--port PORT]');
	console.log('  Starts a test server using the specified mocks. Defaults to port 8080.');
	/* eslint-enable no-console */
	process.exit(0);
}

const createMocks = require('./');
const mocks = createMocks();
mocks.logger.enable();

opts._.forEach((module) => {
	require(path.resolve(process.cwd(), module))(mocks);
});

const app = connect();
mocks.useWith(app);
app.listen(opts.port, () => {
	/* eslint-disable no-console */
	console.log(`Starting server at http://localhost:${opts.port}/ ...`);
	/* eslint-enable no-console */
});
