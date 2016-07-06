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

		it('should save the path', function() {
			expect(rule.path).toBe(path);
		});

		it('should save the collection', function() {
			expect(rule.collection).toBe(collection);
		});

		it('should default to an empty set for options', function() {
			expect(rule.opts).toEqual({});
		});

		it('should default to a null handler', function() {
			expect(rule.handler).toBe(null);
		});

		it('should default to an empty set of paramFilters', function() {
			expect(rule.paramFilters).toEqual([]);
		});

		it('should save the options', function() {
			var opts = { foo: 1, bar: 2 };
			rule = new MiddlewareRule(path, collection, opts);
			expect(rule.opts).toEqual(opts);
		});

		it('should ignore a prefilter passed in the options', function() {
			var prefilter = { foo: 5 };
			rule = new MiddlewareRule(path, collection, { prefilter: prefilter });
			expect(rule.prefilter).not.toEqual(prefilter);
		});

		it('should ignore a postfilter passed in the options', function() {
			var postfilter = { foo: 5 };
			rule = new MiddlewareRule(path, collection, { postfilter: postfilter });
			expect(rule.postfilter).not.toEqual(postfilter);
		});

		it('should have a logger', function() {
			expect(rule.logger).toBeDefined();
		});

		it('should have a default "collectionKey" of "items"', function() {
			expect(rule.collectionKey).toBe('items');
		});

		it('should change the "collectionKey" when passed as an option', function() {
			var key = 'foobar';
			rule = new MiddlewareRule(path, collection, { collectionKey: key });
			expect(rule.collectionKey).toBe(key);
		});

		it('should have a default "countKey" of "total"', function() {
			expect(rule.countKey).toBe('total');
		});

		it('should change the "countKey" when passed as an option', function() {
			var key = 'foobar';
			rule = new MiddlewareRule(path, collection, { countKey: key });
			expect(rule.countKey).toBe(key);
		});

		describe('offset params', function() {

			it('should default to ["offset"]', function() {
				expect(rule.offsetParams).toEqual(['offset']);
			});

			it('should change when passed as a string option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { offsetParam: key });
				expect(rule.offsetParams).toEqual([key]);
			});

			it('should change when passed as an array option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { offsetParam: [key] });
				expect(rule.offsetParams).toEqual([key]);
			});

		});

		describe('limit params', function() {

			it('should default to ["limit"]', function() {
				expect(rule.limitParams).toEqual(['limit']);
			});

			it('should change when passed as a string option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { limitParam: key });
				expect(rule.limitParams).toEqual([key]);
			});

			it('should change when passed as an array option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { limitParam: [key] });
				expect(rule.limitParams).toEqual([key]);
			});

		});

		describe('query params', function() {

			it('should default to ["query", "q"]', function() {
				expect(rule.queryParams).toContain('q');
				expect(rule.queryParams).toContain('query');
			});

			it('should change when passed as a string option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { queryParam: key });
				expect(rule.queryParams).toEqual([key]);
			});

			it('should change when passed as an array option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { queryParam: [key] });
				expect(rule.queryParams).toEqual([key]);
			});

		});

		describe('sortBy params', function() {

			it('should default to ["sortBy"]', function() {
				expect(rule.sortByParams).toEqual(['sortBy']);
			});

			it('should change when passed as a string option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortByParam: key });
				expect(rule.sortByParams).toEqual([key]);
			});

			it('should change when passed as an array option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortByParam: [key] });
				expect(rule.sortByParams).toEqual([key]);
			});

		});

		describe('sortDir params', function() {

			it('should default to ["sortDir"]', function() {
				expect(rule.sortDirParams).toEqual(['sortDir']);
			});

			it('should change when passed as a string option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortDirParam: key });
				expect(rule.sortDirParams).toEqual([key]);
			});

			it('should change when passed as an array option', function() {
				var key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortDirParam: [key] });
				expect(rule.sortDirParams).toEqual([key]);
			});

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

	describe('deleteCollection()', function() {

		beforeEach(function() {
			response = rule.deleteCollection({});
		});

		it('should empty the collection', function() {
			expect(rule.getCollection().data.items).toEqual([]);
			expect(rule.getCollection().data.total).toBe(0);
		});

		it('should return the empty collection', function() {
			expect(response.data.items).toEqual([]);
			expect(response.data.total).toBe(0);
		});

		it('should return a 200 status', function() {
			expect(response.status).toBe(200);
		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			expect(function() {
				rule.deleteCollection({});
			}).not.toThrow();
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.deleteCollection({});
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.deleteCollection(originalParams, {}, null);
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

			it('should modify the collection in place (i.e. keep the var reference)', function() {
				expect(rule.collection).toBe(collection);
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
			foo: 'baz'
		}, {
			id: 2,
			foo: 'bar'
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

		describe('when a "sortBy" parameter is specified', function() {

			it('should sort by that field in ascending order', function() {
				response = rule.getCollection({ sortBy: 'foo' });
				expect(response.data.items).toEqual([data[1], data[0], data[2]]);
			});

			describe('when a "sortDir" parameter is set to "asc"', function() {

				it('should sort by that field in ascending order', function() {
					response = rule.getCollection({ sortBy: 'foo', sortDir: 'asc' });
					expect(response.data.items).toEqual([data[1], data[0], data[2]]);
				});

			});

			describe('when a "sortDir" parameter is set to "desc"', function() {

				it('should sort by that field in descending order', function() {
					response = rule.getCollection({ sortBy: 'foo', sortDir: 'desc' });
					expect(response.data.items).toEqual([data[2], data[0], data[1]]);
				});

			});

		});

		describe('when a filtering parameter is specified', function() {

			it('should respond with only the items that match that property', function() {
				response = rule.getCollection({ foo: 'bar' });
				expect(response.data.items).toEqual(data.slice(1, 2));
				expect(response.data.total).toBe(1);
			});

			it('should perform exact matches', function() {
				response = rule.getCollection({ foo: 'ba' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

			it('should ignore parameters with a value of undefined', function() {
				response = rule.getCollection({ foo: undefined });
				expect(response.data.items).not.toEqual([]);
				expect(response.data.total).toBeGreaterThan(0);
			});

			it('should intersect with the "query" parameter', function() {
				response = rule.getCollection({ foo: 'bar', query: 'baz' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

		});

		describe('when a custom filter is defined', function() {

			beforeEach(function() {
				// Add filter that checks if the "foo" property equals "bar".
				rule.paramFilters.push({
					param: 'foobar',
					filter: function(item, val) {
						if (val === 'true') {
							return item.foo === 'bar';
						} else {
							return item.foo !== 'bar';
						}
					}
				});
			});

			it('should use the filter', function() {
				response = rule.getCollection({ foobar: 'true' });
				expect(response.data.items).toEqual(data.slice(1, 2));
				expect(response.data.total).toBe(1);

				response = rule.getCollection({ foobar: 'false' });
				expect(response.data.total).toBe(2);
			});

			it('should intersect with other filters', function() {
				response = rule.getCollection({ foobar: 'true', foo: 'pax' });
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

	describe('replaceCollection()', function() {

		var data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}];

		describe('when passed an array of data', function() {

			beforeEach(function() {
				response = rule.replaceCollection({}, data);
			});

			it('should replace the collection with that data', function() {
				expect(rule.getCollection().data.items).toEqual(data);
				expect(rule.getCollection().data.total).toBe(data.length);
			});

			it('should return the new collection', function() {
				expect(response.data.items).toEqual(data);
				expect(response.data.total).toBe(data.length);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		describe('when passed a single item', function() {

			var singleItem;

			beforeEach(function() {
				singleItem = data[0];
				response = rule.replaceCollection({}, singleItem);
			});

			it('should replace the collection with only that item', function() {
				expect(rule.getCollection().data.items).toEqual([singleItem]);
				expect(rule.getCollection().data.total).toBe(1);
			});

			it('should return the new collection', function() {
				expect(response.data.items).toEqual([singleItem]);
				expect(response.data.total).toBe(1);
			});

			it('should return a 200 status', function() {
				expect(response.status).toBe(200);
			});

		});

		it('should support a prefilter', function() {
			rule.prefilter = prefilterFunc;
			rule.replaceCollection({}, data);
			expect(rule.getCollection().data.items).toEqual([prefilterData]);
		});

		it('should support a postfilter', function() {
			rule.postfilter = postfilterFunc;
			response = rule.replaceCollection({}, data);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', function() {
			var originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.replaceCollection(originalParams, data, null);
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

	describe('reset()', function() {

		it('should replace the collection with the original data', function() {
			var changingCollection = [
				{ foo: 1 },
				{ foo: 2 }
			];
			var originalCollection = changingCollection.slice();
			rule = new MiddlewareRule(path, changingCollection);
			rule.deleteCollection();
			rule.reset();
			expect(rule.collection).toEqual(originalCollection);
		});

	});

	describe('custom handler', function() {

		var handler, expectedReturn;

		beforeEach(function() {
			expectedReturn = 'expected return value';
			handler = jasmine.createSpy('handler');
			handler.and.returnValue(expectedReturn);
			rule.handler = handler;
		});

		it('should override addItem()', function() {
			response = rule.addItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override deleteItem()', function() {
			response = rule.deleteItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override extendCollection()', function() {
			response = rule.extendCollection();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override extendItem()', function() {
			response = rule.extendItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override getCollection()', function() {
			response = rule.getCollection();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override getItem()', function() {
			response = rule.getItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override replaceItem()', function() {
			response = rule.replaceItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

	});

});
