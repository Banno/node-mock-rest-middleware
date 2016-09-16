#!/usr/bin/env node
'use strict';

var defaultOpts = {
	default: {
		port: 8080
	}
};

var connect = require('connect');
var opts = require('minimist')(process.argv.slice(2), defaultOpts);
var path = require('path');

if (opts._.length === 0) {
	console.log('Usage: ' + path.basename(process.argv[1]) + ' mockModule1 [mockModule2 ...] [--port PORT]');
	console.log('  Starts a test server using the specified mocks. Defaults to port 8080.');
	process.exit(0);
}

var createMocks = require('./');
var mocks = createMocks({ fingerprinting: true });
mocks.logger.enable();

opts._.forEach(function(module) {
	require(path.resolve(process.cwd(), module))(mocks);
});

var app = connect();
mocks.useWith(app);
app.listen(opts.port, function() {
	console.log(`Starting server at http://localhost:${opts.port}/ ...`);
});
