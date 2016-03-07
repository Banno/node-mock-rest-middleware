'use strict';
describe('MiddlewareRule constructor', function() {

	var MiddlewareRule = require('../')().MiddlewareRule;

	var path = new RegExp('/foo');
	var collection = {};

	it('should save the path', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.path).toBe(path);
	});

	it('should convert string paths to RegExp', function() {
		path = '/foo';
		var rule = new MiddlewareRule(path, collection);
		expect(rule.path instanceof RegExp).toBe(true);
	});

	it('should save the collection', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.collection).toBe(collection);
	});

});
