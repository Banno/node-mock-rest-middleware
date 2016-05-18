'use strict';
describe('addResource()', function() {

	var middleware = require('../');
	var MiddlewareRule = require('../middlewarerule');
	var mocks, collection;

	beforeEach(function() {
		mocks = middleware();
		collection = {};
	});

	it('should start with no rules', function() {
		expect(mocks.rules.length).toBe(0);
	});

	it('should return the newly created rule', function() {
		var rule = mocks.addResource('foo', collection);
		expect(rule instanceof MiddlewareRule).toBe(true);
	});

	it('should require a path argument', function() {
		expect(function() {
			mocks.addResource();
		}).toThrow();
	});

	it('should require a collection argument', function() {
		expect(function() {
			mocks.addResource('foo');
		}).toThrow();
	});

	it('should add a new rule', function() {
		mocks.addResource('foo', collection);
		expect(mocks.rules.length).toBe(1);
	});

	it('should replace the default logger with the one from the middleware', function() {
		var rule = mocks.addResource('foo', collection);
		expect(rule.logger).toBe(mocks.logger);
	});

});
