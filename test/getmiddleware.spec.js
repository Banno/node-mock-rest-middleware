'use strict';
describe('getMiddleware()', function() {

	var middleware = require('../');

	var mocks, collection, path, response, next, handler;

	beforeEach(function() {
		path = '/foo';
		collection = [{ foo: 1, bar: 2 }, { foo: 3, bar: 4 }];
		mocks = middleware();
		mocks.addResource(path, collection);
		response = jasmine.createSpyObj('serverResponse', ['end', 'setHeader', 'write', 'writeHead']);
		next = jasmine.createSpy('next() callback');
		handler = mocks.getMiddleware()[0];
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
		handler({ url: path }, response, next);
		expect(next).not.toHaveBeenCalled();
	});

	it('should NOT handle unrelated URLs', function() {
		handler({ url: '/other' }, response, next);
		expect(next).toHaveBeenCalled();
	});

	describe('GET /path', function() {

		var responseData;

		beforeEach(function() {
			handler({ url: path, method: 'GET' }, response, next);
			responseData = JSON.parse(response.end.calls.argsFor(0)[0]);
		});

		it('should respond with an object with "items" and "total" properties', function() {
			expect(responseData).toEqual(jasmine.any(Object));
			expect(responseData.items).toBeDefined();
			expect(responseData.total).toBeDefined();
		});

		it('should return the full collection in "items"', function() {
			expect(responseData.items).toEqual(collection);
		});

		it('should return the count in "total"', function() {
			expect(responseData.total).toBe(collection.length);
		});

		it('should respond with a 200 code', function() {
			expect(response.writeHead).toHaveBeenCalledWith(200);
		});

		it('should respond with an application/json type', function() {
			expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
		});

	});

	describe('unknown method', function() {

		beforeEach(function() {
			handler({ url: path, method: 'FOO' }, response, next);
		});

		it('should respond with a 405 code', function() {
			expect(response.writeHead).toHaveBeenCalledWith(405);
		});

		it('should end the response', function() {
			expect(response.end).toHaveBeenCalled();
		});

		it('should NOT continue to the next middleware', function() {
			expect(next).not.toHaveBeenCalled();
		});

	});

});
