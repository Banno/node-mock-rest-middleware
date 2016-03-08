'use strict';
describe('getMiddleware()', function() {

	var middleware = require('../');

	var mocks, collection, path, response, next;

	var runHandlers = function(req, res, next) {
		var middleware = mocks.getMiddleware();
		for (var i = 0; i < middleware.length; i++) {
			next.calls.reset();
			middleware[i](req, res, next);
			if (!next.calls.any()) {
				break;
			}
		}
	};

	var getResponseData = function() {
		return response.end.calls.argsFor(0)[0] ? JSON.parse(response.end.calls.argsFor(0)[0]) : undefined;
	};

	beforeEach(function() {
		path = '/foo';
		collection = [{ id: 42, foo: 1, bar: 2 }, { id: 77, foo: 3, bar: 4 }];
		mocks = middleware();
		mocks.addResource(path, collection);
		response = jasmine.createSpyObj('serverResponse', ['end', 'setHeader', 'write', 'writeHead']);
		next = jasmine.createSpy('next() callback');
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

	describe('GET /path', function() {

		var responseData;

		beforeEach(function() {
			runHandlers({ url: path, method: 'GET' }, response, next);
			responseData = getResponseData();
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

	describe('GET /path/:id', function() {

		var responseData;

		describe('when an item with that ID exists', function() {

			beforeEach(function() {
				runHandlers({ url: path + '/' + collection[0].id, method: 'GET' }, response, next);
				responseData = getResponseData();
			});

			it('should respond with the matching object', function() {
				expect(responseData).toEqual(collection[0]);
			});

			it('should respond with a 200 code', function() {
				expect(response.writeHead).toHaveBeenCalledWith(200);
			});

			it('should respond with an application/json type', function() {
				expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
			});

		});

		describe('when an item with that ID cannot be found', function() {

			beforeEach(function() {
				runHandlers({ url: path + '/nonexistent', method: 'GET' }, response, next);
			});

			it('should respond with a 404 code', function() {
				expect(response.writeHead).toHaveBeenCalledWith(404);
			});

		});

	});

	describe('unknown methods', function() {

		beforeEach(function() {
			runHandlers({ url: path, method: 'FOO' }, response, next);
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
