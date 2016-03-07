'use strict';
describe('getMiddleware()', function() {

	var middleware = require('../');

	var mocks, collection, path, callback;

	beforeEach(function() {
		path = '/foo';
		collection = {};
		mocks = middleware();
		mocks.addResource(path, collection);
		callback = jasmine.createSpy('next() callback');
	});

	it('should return an array of functions', function() {
		expect(Array.isArray(mocks.getMiddleware())).toBe(true);
		expect(mocks.getMiddleware()[0]).toEqual(jasmine.any(Function));
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

	it('should handle matching URLs', function() {
		var handler = mocks.getMiddleware()[0];
		handler({ url: path }, {}, callback);
		expect(callback).not.toHaveBeenCalled();
	});

	it('should NOT handle unrelated URLs', function() {
		var handler = mocks.getMiddleware()[0];
		handler({ url: '/other' }, {}, callback);
		expect(callback).toHaveBeenCalled();
	});

});
