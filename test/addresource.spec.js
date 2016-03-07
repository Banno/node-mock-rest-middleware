'use strict';
describe('addResource()', function() {

	var middleware = require('../');
	var mocks, collection;

	beforeEach(function() {
		mocks = middleware();
		collection = {};
	});

	it('should start with no rules', function() {
		expect(mocks.rules.length).toBe(0);
	});

	it('should return the middleware instance (for chaining)', function() {
		var ret = mocks.addResource('foo', collection);
		expect(ret.addResource).toBeDefined();
		expect(ret.getMiddleware).toBeDefined();
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

});
