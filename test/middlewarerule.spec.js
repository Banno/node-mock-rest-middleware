'use strict';
describe('MiddlewareRule constructor', function() {

	var MiddlewareRule = require('../')().MiddlewareRule;

	var path = '/foo';
	var collection = [];

	it('should convert the path to RegExp', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.path instanceof RegExp).toBe(true);
		expect(rule.path.source).toBe('\\/foo');
	});

	it('should save the collection', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.collection).toBe(collection);
	});

});
