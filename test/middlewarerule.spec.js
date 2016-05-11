'use strict';
describe('MiddlewareRule', function() {

	var MiddlewareRule = require('../')().MiddlewareRule;

	var path = '/foo';
	var collection, rule, response;

	var prefilterFunc, postfilterFunc;
	var prefilterData = { filtered: 'prefilter' };
	var postfilterData = { filtered: 'postfilter' };

	beforeEach(function() {
		prefilterFunc = jasmine.createSpy('prefilterFunc').and.returnValue({
			params: {},
			data: prefilterData
		});
		postfilterFunc = jasmine.createSpy('postfilterFunc').and.returnValue(postfilterData);
	});

	beforeEach(function() {
		collection = [];
		rule = new MiddlewareRule(path, collection);
	});

	describe('constructor', function() {

		it('should convert the path to RegExp', function() {
			expect(rule.path instanceof RegExp).toBe(true);
			expect(rule.path.source).toBe('\\/foo');
		});

		it('should save the collection', function() {
			expect(rule.collection).toBe(collection);
		});

		it('should default to an empty set for options', function() {
			expect(rule.opts).toEqual({});
		});

		it('should save the options', function() {
			var opts = { foo: 1, bar: 2 };
			rule = new MiddlewareRule(path, collection, opts);
			expect(rule.opts).toEqual(opts);
		});

		describe('default prefilter', function() {

			it('should exist if no prefilter is specified', function() {
				expect(rule.prefilter).toEqual(jasmine.any(Function));
			});

			it('should return the params & data unchanged', function() {
				var params = { id: 99 };
				var data = { foo: 1, bar: 2 };
				expect(rule.prefilter(params, data)).toEqual({
					params: params,
					data: data
				});
			});

		});

		describe('default postfilter', function() {

			it('should exist if no postfilter is specified', function() {
				expect(rule.postfilter).toEqual(jasmine.any(Function));
			});

			it('should return the data unchanged', function() {
				var params = { id: 99 };
				var data = { foo: 1, bar: 2 };
				expect(rule.postfilter(params, data)).toEqual(data);
			});

		});

		describe('"idKey" property', function() {

			it('should first look for a defined "idKey" option', function() {
				var prop = 'idProp';
				rule = new MiddlewareRule(path, collection, { idKey: prop });
				expect(rule.idKey).toBe(prop);
			});

			it('should then look for an "id" property', function() {
				collection.push({ id: 1, foo: 2 });
				rule = new MiddlewareRule(path, collection);
				expect(rule.idKey).toBe('id');
			});

			it('should then look for an "*Id" property', function() {
				collection.push({ foo: 1, applicationId: 2, bar: 3 });
				rule = new MiddlewareRule(path, collection);
				expect(rule.idKey).toBe('applicationId');
			});

			it('should then use the first property', function() {
				collection.push({ foo: 1, bar: 3 });
				rule = new MiddlewareRule(path, collection);
				expect(rule.idKey).toBe('foo');
			});

		});

	});

	describe('addItem()', function() {

		var data = {
			foo: 1,
			bar: 2
		};

		beforeEach(function() {
			response = rule.addItem(null, data);
		});

		it('should add the body data to the collection', function() {
			expect(rule.getCollection().data.items).toEqual([data]);
		});

		it('should return the data', function() {
			expect(response.data).toEqual(data);
		});

		it('should return a 200 status', function() {
			expect(response.status).toBe(200);
		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			rule.addItem(null, data);
			expect(rule.getCollection().data.items.pop()).toEqual(prefilterData);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.addItem(null, data);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.addItem(originalParams, data, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('deleteItem()', function() {

		var data = {
			id: 1,
			foo: 2
		};

		beforeEach(function() {
			rule.addItem(null, data);
		});

		describe('when the item exists', function() {

			beforeEach(function() {
				response = rule.deleteItem({ id: data.id });
			});

			it('should delete the item from the collection', function() {
				expect(rule.getItem({ id: data.id }).status).toBe(404);
			});

			it('should return the deleted item', function() {
				expect(response.data).toEqual(data);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		describe('when the item can\'t be found', function() {

			beforeEach(function() {
				response = rule.deleteItem({ id: data.id + 1 });
			});

			it('should not change the collection', function() {
				expect(rule.getCollection().data.items).toEqual([data]);
			});

			it('should return null for data', function() {
				expect(response.data).toBe(null);
			});

			it('should return a 404 status', function() {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			rule.deleteItem({ id: data.id });
			expect(rule.getCollection().data.items).toEqual([data]);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.deleteItem({ id: data.id });
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.deleteItem(originalParams, { id: data.id }, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('extendCollection()', function() {

		var data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}, {
			id: 3,
			foo: 4
		}];
		var changes = [{
			id: 1,
			foo: 3
		}, {
			id: 999
		}, {
			id: 3,
			foo: 5,
			bar: 6
		}];

		describe('when at least one item is matched', function() {

			beforeEach(function() {
				rule.addItem(null, data[0]);
				rule.addItem(null, data[1]);
				rule.addItem(null, data[2]);
				response = rule.extendCollection({}, changes);
			});

			it('should extend the matching items', function() {
				expect(rule.getItem({ id: 1 }).data).toEqual(changes[0]);
				expect(rule.getItem({ id: 3 }).data).toEqual(changes[2]);
			});

			it('should not change other items', function() {
				expect(rule.getItem({ id: 2 }).data).toEqual(data[1]);
			});

			it('should not add items', function() {
				expect(rule.getItem({ id: 999 }).status).toEqual(404);
			});

			it('should return the matching, changed items', function() {
				expect(response.data.length).toBe(2);
				expect(response.data[0]).toEqual(changes[0]);
				expect(response.data[1]).toEqual(changes[2]);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		describe('when nothing matches', function() {

			beforeEach(function() {
				response = rule.extendCollection({}, changes);
			});

			it('should not change the collection', function() {
				expect(rule.getCollection().data.items).toEqual([]);
			});

			it('should return an empty array for the data', function() {
				expect(response.data).toEqual([]);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			rule.addItem(null, data[0]);
			rule.extendCollection({}, changes);
			expect(rule.getCollection().data.items).toEqual([prefilterData]);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
			rule.addItem(null, data[2]);
			response = rule.extendCollection({}, changes);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.extendCollection(originalParams, changes, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('extendItem()', function() {

		var data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}];
		var change = {
			id: 1,
			foo: 3,
			bar: 4
		};

		beforeEach(function() {
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
		});

		describe('when a matching item exists', function() {

			beforeEach(function() {
				response = rule.extendItem({ id: change.id }, change);
			});

			it('should extend the item', function() {
				expect(rule.getItem({ id: change.id }).data).toEqual(change);
			});

			it('should return the changed data', function() {
				expect(response.data).toEqual(change);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		describe('when a matching item can\'t be found', function() {

			beforeEach(function() {
				change.id = 999;
				response = rule.extendItem({ id: change.id }, change);
			});

			it('should not change the collection', function() {
				expect(rule.getCollection().data.items).toEqual(data);
			});

			it('should return null for the data', function() {
				expect(response.data).toBe(null);
			});

			it('should return a 404 status', function() {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			rule.extendItem({ id: change.id }, change);
			expect(rule.getCollection().data.items).toEqual(data);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.extendItem({ id: change.id }, change);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.extendItem(originalParams, change, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('getCollection()', function() {

		var data = [{
			id: 1,
			foo: 'bar'
		}, {
			id: 2,
			foo: 'baz'
		}, {
			id: 3,
			foo: 'pax'
		}];

		beforeEach(function() {
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
			rule.addItem(null, data[2]);
			response = rule.getCollection();
		});

		it('should respond with the items and the total', function() {
			expect(response.data.items).toEqual(data);
			expect(response.data.total).toBe(data.length);
		});

		it('should return a 200 status', function() {
			expect(response.status).toBe(200);
		});

		describe('when an "offset" parameter is specified', function() {

			beforeEach(function() {
				response = rule.getCollection({ offset: 1 });
			});

			it('should return a slice of the collection', function() {
				expect(response.data.items).toEqual(data.slice(1));
			});

			it('should return the total of the non-sliced collection', function() {
				expect(response.data.total).toBe(data.length);
			});

		});

		describe('when a "limit" parameter is specified', function() {

			beforeEach(function() {
				response = rule.getCollection({ limit: 1 });
			});

			it('should return a slice of the collection', function() {
				expect(response.data.items).toEqual(data.slice(0, 1));
			});

			it('should return the total of the non-sliced collection', function() {
				expect(response.data.total).toBe(data.length);
			});

		});

		describe('when both "offset" and "limit" parameters are specified', function() {

			beforeEach(function() {
				response = rule.getCollection({ offset: 1, limit: 1 });
			});

			it('should return a slice of the collection', function() {
				expect(response.data.items).toEqual(data.slice(1, 2));
			});

			it('should return the total of the non-sliced collection', function() {
				expect(response.data.total).toBe(data.length);
			});

		});

		describe('when a "query" parameter is specified', function() {

			beforeEach(function() {
				response = rule.getCollection({ query: 'ba' });
			});

			it('should respond with items that (partially) match', function() {
				expect(response.data.items).toEqual(data.slice(0, 2));
			});

			it('should return the size of the filtered collection', function() {
				expect(response.data.total).toBe(2);
			});

		});

		describe('when a "q" parameter is specified', function() {

			beforeEach(function() {
				response = rule.getCollection({ q: 'ba' });
			});

			it('should respond with items that (partially) match', function() {
				expect(response.data.items).toEqual(data.slice(0, 2));
			});

			it('should return the size of the filtered collection', function() {
				expect(response.data.total).toBe(2);
			});

		});

		describe('when a filtering parameter is specified', function() {

			it('should respond with only the items that match that property', function() {
				response = rule.getCollection({ foo: 'bar' });
				expect(response.data.items).toEqual(data.slice(0, 1));
				expect(response.data.total).toBe(1);
			});

			it('should perform exact matches', function() {
				response = rule.getCollection({ foo: 'ba' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

			it('should intersect with the "query" parameter', function() {
				response = rule.getCollection({ foo: 'bar', query: 'baz' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			expect(rule.getCollection({ id: 999 }).data.items).toEqual(data);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.getCollection();
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.getCollection(originalParams, null, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('getItem()', function() {

		var data = {
			id: 1,
			foo: 2
		};

		beforeEach(function() {
			rule.addItem(null, data);
		});

		describe('when the item exists', function() {

			beforeEach(function() {
				response = rule.getItem({ id: data.id });
			});

			it('should not change the collection', function() {
				expect(rule.getCollection().data.items).toEqual([data]);
			});

			it('should return the item', function() {
				expect(response.data).toEqual(data);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		describe('when the item can\'t be found', function() {

			beforeEach(function() {
				response = rule.getItem({ id: data.id + 1 });
			});

			it('should not change the collection', function() {
				expect(rule.getCollection().data.items).toEqual([data]);
			});

			it('should return `undefined` for the data', function() {
				expect(response.data).toBeUndefined();
			});

			it('should return a 404 status', function() {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			expect(rule.getItem({ id: 999 }).data).toBeUndefined();
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.getItem({ id: data.id });
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.getItem(originalParams, null, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('replaceItem()', function() {

		var change;
		var data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}];

		beforeEach(function() {
			change = {
				id: 1,
				bar: 4
			};
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
		});

		describe('when a matching item exists', function() {

			beforeEach(function() {
				response = rule.replaceItem({ id: change.id }, change);
			});

			it('should replace the item', function() {
				expect(rule.getItem({ id: change.id }).data).toEqual(change);
			});

			it('should return the changed data', function() {
				expect(response.data).toEqual(change);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		describe('when a matching item can\'t be found', function() {

			beforeEach(function() {
				change.id = 999;
				response = rule.replaceItem({ id: change.id }, change);
			});

			it('should not change the collection', function() {
				expect(rule.getCollection().data.items).toEqual(data);
			});

			it('should return null for the data', function() {
				expect(response.data).toBe(null);
			});

			it('should return a 404 status', function() {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			rule.replaceItem({ id: change.id }, change);
			expect(rule.getCollection().data.items).toEqual(data);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.replaceItem({ id: change.id }, change);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.replaceItem(originalParams, change, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

});
