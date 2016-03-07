'use strict';
describe('getMiddleware()', function() {

	var middleware = require('../');
	var mocks;

	beforeEach(function() {
		mocks = middleware();
	});

	it('should return an array', function() {
		expect(Array.isArray(mocks.getMiddleware())).toBe(true);
	});

	it('should work with Connect', function() {
		var connect = require('connect');
		var http = require('http');
		var app = connect();
		expect(function() {
			app.use(mocks.getMiddleware());
			http.createServer(app);
		}).not.toThrow();
	});

});
