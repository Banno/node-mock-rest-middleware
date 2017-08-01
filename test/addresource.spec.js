'use strict';
describe('addResource()', () => {

	const middleware = require('../');
	const MiddlewareRule = require('../middlewarerule');
	let mocks, collection;

	beforeEach(() => {
		mocks = middleware();
		collection = [];
	});

	it('should start with no rules', () => {
		expect(mocks.rules.length).toBe(0);
	});

	it('should return the newly created rule', () => {
		let rule = mocks.addResource('foo', collection);
		expect(rule instanceof MiddlewareRule).toBe(true);
	});

	it('should require a path argument', () => {
		expect(() => {
			mocks.addResource();
		}).toThrow();
	});

	it('should require a collection argument', () => {
		expect(() => {
			mocks.addResource('foo');
		}).toThrow();
	});

	it('should add a new rule', () => {
		mocks.addResource('foo', collection);
		expect(mocks.rules.length).toBe(1);
	});

	it('should replace the default logger with the one from the middleware', () => {
		let rule = mocks.addResource('foo', collection);
		expect(rule.logger).toBe(mocks.logger);
	});

});
