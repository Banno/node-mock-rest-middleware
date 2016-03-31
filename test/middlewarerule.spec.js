'use strict';
describe('MiddlewareRule constructor', function() {

	var MiddlewareRule = require('../')().MiddlewareRule;

	var path = '/foo';
	var collection;

	beforeEach(function() {
		collection = [];
	});

	it('should convert the path to RegExp', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.path instanceof RegExp).toBe(true);
		expect(rule.path.source).toBe('\\/foo');
	});

	it('should save the collection', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.collection).toBe(collection);
	});

	it('should default to an empty set for options', function() {
		var rule = new MiddlewareRule(path, collection);
		expect(rule.opts).toEqual({});
	});

	it('should save the options', function() {
		var opts = { foo: 1, bar: 2 };
		var rule = new MiddlewareRule(path, collection, opts);
		expect(rule.opts).toEqual(opts);
	});

	describe('"idKey" property', function() {

		it('should first look for a defined "idKey" option', function() {
			var prop = 'idProp';
			var rule = new MiddlewareRule(path, collection, { idKey: prop });
			expect(rule.idKey).toBe(prop);
		});

		it('should then look for an "id" property', function() {
			collection.push({ id: 1, foo: 2 });
			var rule = new MiddlewareRule(path, collection);
			expect(rule.idKey).toBe('id');
		});

		it('should then look for an "*Id" property', function() {
			collection.push({ foo: 1, applicationId: 2, bar: 3 });
			var rule = new MiddlewareRule(path, collection);
			expect(rule.idKey).toBe('applicationId');
		});

		it('should then use the first property', function() {
			collection.push({ foo: 1, bar: 3 });
			var rule = new MiddlewareRule(path, collection);
			expect(rule.idKey).toBe('foo');
		});

	});

});
