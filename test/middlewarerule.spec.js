'use strict';
describe('MiddlewareRule', () => {

	const MiddlewareRule = require('../')().MiddlewareRule;
	const extend = require('extend');
	const pathToRegexp = require('path-to-regexp');

	let path = '/foo';
	let pathAsRegExp, collection, rule, response;

	let prefilterFunc, postfilterFunc;
	let prefilterData = { filtered: 'prefilter' };
	let postfilterData = { filtered: 'postfilter' };

	beforeEach(() => {
		prefilterFunc = jasmine.createSpy('prefilterFunc').and.returnValue({
			params: {},
			data: prefilterData
		});
		postfilterFunc = jasmine.createSpy('postfilterFunc').and.returnValue(postfilterData);
	});

	beforeEach(() => {
		collection = [];
		pathAsRegExp = pathToRegexp(path + '/:id?(\\?.*)?', undefined, { sensitive: true, strict: false });
		rule = new MiddlewareRule(pathAsRegExp, collection);
	});

	describe('constructor', () => {

		it('should save the path', () => {
			expect(rule.path).toBe(pathAsRegExp);
		});

		it('should save the collection', () => {
			expect(rule.collection).toBe(collection);
		});

		it('should default to an empty set for options', () => {
			expect(rule.opts).toEqual({});
		});

		it('should default to a null handler', () => {
			expect(rule.handler).toBe(null);
		});

		it('should default to an empty set of paramFilters', () => {
			expect(rule.paramFilters).toEqual([]);
		});

		it('should save the options', () => {
			let opts = { foo: 1, bar: 2 };
			rule = new MiddlewareRule(path, collection, opts);
			expect(rule.opts).toEqual(opts);
		});

		it('should ignore a prefilter passed in the options', () => {
			let prefilter = { foo: 5 };
			rule = new MiddlewareRule(path, collection, { prefilter: prefilter });
			expect(rule.prefilter).not.toEqual(prefilter);
		});

		it('should ignore a postfilter passed in the options', () => {
			let postfilter = { foo: 5 };
			rule = new MiddlewareRule(path, collection, { postfilter: postfilter });
			expect(rule.postfilter).not.toEqual(postfilter);
		});

		it('should have a logger', () => {
			expect(rule.logger).toBeDefined();
		});

		it('should have a default "collectionKey" of "items"', () => {
			expect(rule.collectionKey).toBe('items');
		});

		it('should change the "collectionKey" when passed as an option', () => {
			let key = 'foobar';
			rule = new MiddlewareRule(path, collection, { collectionKey: key });
			expect(rule.collectionKey).toBe(key);
		});

		it('should have a default "countKey" of "total"', () => {
			expect(rule.countKey).toBe('total');
		});

		it('should change the "countKey" when passed as an option', () => {
			let key = 'foobar';
			rule = new MiddlewareRule(path, collection, { countKey: key });
			expect(rule.countKey).toBe(key);
		});

		describe('offset params', () => {

			it('should default to ["offset"]', () => {
				expect(rule.offsetParams).toEqual(['offset']);
			});

			it('should change when passed as a string option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { offsetParam: key });
				expect(rule.offsetParams).toEqual([key]);
			});

			it('should change when passed as an array option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { offsetParam: [key] });
				expect(rule.offsetParams).toEqual([key]);
			});

		});

		describe('limit params', () => {

			it('should default to ["limit"]', () => {
				expect(rule.limitParams).toEqual(['limit']);
			});

			it('should change when passed as a string option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { limitParam: key });
				expect(rule.limitParams).toEqual([key]);
			});

			it('should change when passed as an array option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { limitParam: [key] });
				expect(rule.limitParams).toEqual([key]);
			});

		});

		describe('query params', () => {

			it('should default to ["query", "q"]', () => {
				expect(rule.queryParams).toContain('q');
				expect(rule.queryParams).toContain('query');
			});

			it('should change when passed as a string option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { queryParam: key });
				expect(rule.queryParams).toEqual([key]);
			});

			it('should change when passed as an array option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { queryParam: [key] });
				expect(rule.queryParams).toEqual([key]);
			});

		});

		describe('sortBy params', () => {

			it('should default to ["sortBy"]', () => {
				expect(rule.sortByParams).toEqual(['sortBy']);
			});

			it('should change when passed as a string option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortByParam: key });
				expect(rule.sortByParams).toEqual([key]);
			});

			it('should change when passed as an array option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortByParam: [key] });
				expect(rule.sortByParams).toEqual([key]);
			});

		});

		describe('sortDir params', () => {

			it('should default to ["sortDir"]', () => {
				expect(rule.sortDirParams).toEqual(['sortDir']);
			});

			it('should change when passed as a string option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortDirParam: key });
				expect(rule.sortDirParams).toEqual([key]);
			});

			it('should change when passed as an array option', () => {
				let key = 'foobar';
				rule = new MiddlewareRule(path, collection, { sortDirParam: [key] });
				expect(rule.sortDirParams).toEqual([key]);
			});

		});

		describe('default prefilter', () => {

			it('should exist if no prefilter is specified', () => {
				expect(rule.prefilter).toEqual(jasmine.any(Function));
			});

			it('should return the params & data unchanged', () => {
				let params = { id: 99 };
				let data = { foo: 1, bar: 2 };
				expect(rule.prefilter(params, data)).toEqual({
					params: params,
					data: data
				});
			});

		});

		describe('default postfilter', () => {

			it('should exist if no postfilter is specified', () => {
				expect(rule.postfilter).toEqual(jasmine.any(Function));
			});

			it('should return the data unchanged', () => {
				let params = { id: 99 };
				let data = { foo: 1, bar: 2 };
				expect(rule.postfilter(params, data)).toEqual(data);
			});

		});

		describe('"idKey" property', () => {

			it('should first look for a defined "idKey" option', () => {
				let prop = 'idProp';
				rule = new MiddlewareRule(path, collection, { idKey: prop });
				expect(rule.idKey).toBe(prop);
			});

			it('should then look for an "id" property', () => {
				collection.push({ id: 1, foo: 2 });
				rule = new MiddlewareRule(path, collection);
				expect(rule.idKey).toBe('id');
			});

			it('should then look for an "*Id" property', () => {
				collection.push({ foo: 1, applicationId: 2, bar: 3 });
				rule = new MiddlewareRule(path, collection);
				expect(rule.idKey).toBe('applicationId');
			});

			it('should then use the first property', () => {
				collection.push({ foo: 1, bar: 3 });
				rule = new MiddlewareRule(path, collection);
				expect(rule.idKey).toBe('foo');
			});

		});

	});

	describe('addItem()', () => {

		let data = {
			foo: 1,
			bar: 2
		};

		beforeEach(() => {
			response = rule.addItem(null, data);
		});

		it('should add the body data to the collection', () => {
			expect(rule.getCollection().data.items).toEqual([data]);
		});

		it('should return the data', () => {
			expect(response.data).toEqual(data);
		});

		it('should return a 200 status', () => {
			expect(response.status).toBe(200);
		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			rule.addItem(null, data);
			expect(rule.getCollection().data.items.pop()).toEqual(prefilterData);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.addItem(null, data);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.addItem(originalParams, data, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('deleteCollection()', () => {

		beforeEach(() => {
			response = rule.deleteCollection({});
		});

		it('should empty the collection', () => {
			expect(rule.getCollection().data.items).toEqual([]);
			expect(rule.getCollection().data.total).toBe(0);
		});

		it('should return the empty collection', () => {
			expect(response.data.items).toEqual([]);
			expect(response.data.total).toBe(0);
		});

		it('should return a 200 status', () => {
			expect(response.status).toBe(200);
		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			expect(() => {
				rule.deleteCollection({});
			}).not.toThrow();
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.deleteCollection({});
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.deleteCollection(originalParams, {}, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('deleteItem()', () => {

		let data = {
			id: 1,
			foo: 2
		};

		beforeEach(() => {
			rule.addItem(null, data);
		});

		describe('when the item exists', () => {

			beforeEach(() => {
				response = rule.deleteItem({ id: data.id });
			});

			it('should delete the item from the collection', () => {
				expect(rule.getItem({ id: data.id }).status).toBe(404);
			});

			it('should modify the collection in place (i.e. keep the var reference)', () => {
				expect(rule.collection).toBe(collection);
			});

			it('should return the deleted item', () => {
				expect(response.data).toEqual(data);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		describe('when the item can\'t be found', () => {

			beforeEach(() => {
				response = rule.deleteItem({ id: data.id + 1 });
			});

			it('should not change the collection', () => {
				expect(rule.getCollection().data.items).toEqual([data]);
			});

			it('should return null for data', () => {
				expect(response.data).toBe(null);
			});

			it('should return a 404 status', () => {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			rule.deleteItem({ id: data.id });
			expect(rule.getCollection().data.items).toEqual([data]);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.deleteItem({ id: data.id });
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.deleteItem(originalParams, { id: data.id }, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('extendCollection()', () => {

		let data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}, {
			id: 3,
			foo: 4
		}];
		let changes = [{
			id: 1,
			foo: 3
		}, {
			id: 999
		}, {
			id: 3,
			foo: 5,
			bar: 6
		}];

		describe('when at least one item is matched', () => {

			beforeEach(() => {
				rule.addItem(null, data[0]);
				rule.addItem(null, data[1]);
				rule.addItem(null, data[2]);
				response = rule.extendCollection({}, changes);
			});

			it('should extend the matching items', () => {
				expect(rule.getItem({ id: 1 }).data).toEqual(changes[0]);
				expect(rule.getItem({ id: 3 }).data).toEqual(changes[2]);
			});

			it('should not change other items', () => {
				expect(rule.getItem({ id: 2 }).data).toEqual(data[1]);
			});

			it('should not add items', () => {
				expect(rule.getItem({ id: 999 }).status).toEqual(404);
			});

			it('should return the matching, changed items', () => {
				expect(response.data.length).toBe(2);
				expect(response.data[0]).toEqual(changes[0]);
				expect(response.data[1]).toEqual(changes[2]);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		describe('when nothing matches', () => {

			beforeEach(() => {
				response = rule.extendCollection({}, changes);
			});

			it('should not change the collection', () => {
				expect(rule.getCollection().data.items).toEqual([]);
			});

			it('should return an empty array for the data', () => {
				expect(response.data).toEqual([]);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			rule.addItem(null, data[0]);
			rule.extendCollection({}, changes);
			expect(rule.getCollection().data.items).toEqual([prefilterData]);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
			rule.addItem(null, data[2]);
			response = rule.extendCollection({}, changes);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.extendCollection(originalParams, changes, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('extendItem()', () => {

		let data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}];
		let change = {
			id: 1,
			foo: 3,
			bar: 4
		};

		beforeEach(() => {
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
		});

		describe('when a matching item exists', () => {

			beforeEach(() => {
				response = rule.extendItem({ id: change.id }, change);
			});

			it('should extend the item', () => {
				expect(rule.getItem({ id: change.id }).data).toEqual(change);
			});

			it('should return the changed data', () => {
				expect(response.data).toEqual(change);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		describe('when a matching item can\'t be found', () => {

			beforeEach(() => {
				change.id = 999;
				response = rule.extendItem({ id: change.id }, change);
			});

			it('should not change the collection', () => {
				expect(rule.getCollection().data.items).toEqual(data);
			});

			it('should return null for the data', () => {
				expect(response.data).toBe(null);
			});

			it('should return a 404 status', () => {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			rule.extendItem({ id: change.id }, change);
			expect(rule.getCollection().data.items).toEqual(data);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.extendItem({ id: change.id }, change);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.extendItem(originalParams, change, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('getCollection()', () => {

		let data = [{
			id: 1,
			foo: 'baz'
		}, {
			id: 2,
			foo: 'bar'
		}, {
			id: 3,
			foo: 'pax'
		}];

		beforeEach(() => {
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
			rule.addItem(null, data[2]);
			response = rule.getCollection();
		});

		it('should respond with the items and the total', () => {
			expect(response.data.items).toEqual(data);
			expect(response.data.total).toBe(data.length);
		});

		it('should return a 200 status', () => {
			expect(response.status).toBe(200);
		});

		describe('when an "offset" parameter is specified', () => {

			beforeEach(() => {
				response = rule.getCollection({ offset: 1 });
			});

			it('should return a slice of the collection', () => {
				expect(response.data.items).toEqual(data.slice(1));
			});

			it('should return the total of the non-sliced collection', () => {
				expect(response.data.total).toBe(data.length);
			});

		});

		describe('when a "limit" parameter is specified', () => {

			beforeEach(() => {
				response = rule.getCollection({ limit: 1 });
			});

			it('should return a slice of the collection', () => {
				expect(response.data.items).toEqual(data.slice(0, 1));
			});

			it('should return the total of the non-sliced collection', () => {
				expect(response.data.total).toBe(data.length);
			});

		});

		describe('when both "offset" and "limit" parameters are specified', () => {

			beforeEach(() => {
				response = rule.getCollection({ offset: 1, limit: 1 });
			});

			it('should return a slice of the collection', () => {
				expect(response.data.items).toEqual(data.slice(1, 2));
			});

			it('should return the total of the non-sliced collection', () => {
				expect(response.data.total).toBe(data.length);
			});

		});

		describe('when a "query" parameter is specified', () => {

			beforeEach(() => {
				response = rule.getCollection({ query: 'ba' });
			});

			it('should respond with items that (partially) match', () => {
				expect(response.data.items).toEqual(data.slice(0, 2));
			});

			it('should return the size of the filtered collection', () => {
				expect(response.data.total).toBe(2);
			});

		});

		describe('when a "q" parameter is specified', () => {

			beforeEach(() => {
				response = rule.getCollection({ q: 'ba' });
			});

			it('should respond with items that (partially) match', () => {
				expect(response.data.items).toEqual(data.slice(0, 2));
			});

			it('should return the size of the filtered collection', () => {
				expect(response.data.total).toBe(2);
			});

		});

		describe('when a "sortBy" parameter is specified', () => {

			it('should sort by that field in ascending order', () => {
				response = rule.getCollection({ sortBy: 'foo' });
				expect(response.data.items).toEqual([data[1], data[0], data[2]]);
			});

			describe('when a "sortDir" parameter is set to "asc"', () => {

				it('should sort by that field in ascending order', () => {
					response = rule.getCollection({ sortBy: 'foo', sortDir: 'asc' });
					expect(response.data.items).toEqual([data[1], data[0], data[2]]);
				});

			});

			describe('when a "sortDir" parameter is set to "desc"', () => {

				it('should sort by that field in descending order', () => {
					response = rule.getCollection({ sortBy: 'foo', sortDir: 'desc' });
					expect(response.data.items).toEqual([data[2], data[0], data[1]]);
				});

			});

		});

		describe('when a filtering parameter is specified', () => {

			it('should respond with only the items that match that property', () => {
				response = rule.getCollection({ foo: 'bar' });
				expect(response.data.items).toEqual(data.slice(1, 2));
				expect(response.data.total).toBe(1);
			});

			it('should perform exact matches', () => {
				response = rule.getCollection({ foo: 'ba' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

			it('should ignore parameters with a value of undefined', () => {
				response = rule.getCollection({ foo: undefined });
				expect(response.data.items).not.toEqual([]);
				expect(response.data.total).toBeGreaterThan(0);
			});

			it('should intersect with the "query" parameter', () => {
				response = rule.getCollection({ foo: 'bar', query: 'baz' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

		});

		describe('when a custom filter is defined', () => {

			beforeEach(() => {
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

			it('should use the filter', () => {
				response = rule.getCollection({ foobar: 'true' });
				expect(response.data.items).toEqual(data.slice(1, 2));
				expect(response.data.total).toBe(1);

				response = rule.getCollection({ foobar: 'false' });
				expect(response.data.total).toBe(2);
			});

			it('should intersect with other filters', () => {
				response = rule.getCollection({ foobar: 'true', foo: 'pax' });
				expect(response.data.items).toEqual([]);
				expect(response.data.total).toBe(0);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			expect(rule.getCollection({ id: 999 }).data.items).toEqual(data);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.getCollection();
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.getCollection(originalParams, null, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('getItem()', () => {

		let data = {
			id: 1,
			foo: 2
		};

		beforeEach(() => {
			rule.addItem(null, data);
		});

		describe('when the item exists', () => {

			beforeEach(() => {
				response = rule.getItem({ id: data.id });
			});

			it('should not change the collection', () => {
				expect(rule.getCollection().data.items).toEqual([data]);
			});

			it('should return the item', () => {
				expect(response.data).toEqual(data);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		describe('when the item can\'t be found', () => {

			beforeEach(() => {
				response = rule.getItem({ id: data.id + 1 });
			});

			it('should not change the collection', () => {
				expect(rule.getCollection().data.items).toEqual([data]);
			});

			it('should return `undefined` for the data', () => {
				expect(response.data).toBeUndefined();
			});

			it('should return a 404 status', () => {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			expect(rule.getItem({ id: 999 }).data).toBeUndefined();
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.getItem({ id: data.id });
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.getItem(originalParams, null, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('replaceCollection()', () => {

		let data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}];

		describe('when passed an array of data', () => {

			beforeEach(() => {
				response = rule.replaceCollection({}, data);
			});

			it('should replace the collection with that data', () => {
				expect(rule.getCollection().data.items).toEqual(data);
				expect(rule.getCollection().data.total).toBe(data.length);
			});

			it('should return the new collection', () => {
				expect(response.data.items).toEqual(data);
				expect(response.data.total).toBe(data.length);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		describe('when passed a single item', () => {

			let singleItem;

			beforeEach(() => {
				singleItem = data[0];
				response = rule.replaceCollection({}, singleItem);
			});

			it('should replace the collection with only that item', () => {
				expect(rule.getCollection().data.items).toEqual([singleItem]);
				expect(rule.getCollection().data.total).toBe(1);
			});

			it('should return the new collection', () => {
				expect(response.data.items).toEqual([singleItem]);
				expect(response.data.total).toBe(1);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			rule.replaceCollection({}, data);
			expect(rule.getCollection().data.items).toEqual([prefilterData]);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.replaceCollection({}, data);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.replaceCollection(originalParams, data, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('replaceItem()', () => {

		let change;
		let data = [{
			id: 1,
			foo: 2
		}, {
			id: 2,
			foo: 3
		}];

		beforeEach(() => {
			change = {
				id: 1,
				bar: 4
			};
			rule.addItem(null, data[0]);
			rule.addItem(null, data[1]);
		});

		describe('when a matching item exists', () => {

			beforeEach(() => {
				response = rule.replaceItem({ id: change.id }, change);
			});

			it('should replace the item', () => {
				expect(rule.getItem({ id: change.id }).data).toEqual(change);
			});

			it('should return the changed data', () => {
				expect(response.data).toEqual(change);
			});

			it('should return a 200 status', () => {
				expect(response.status).toBe(200);
			});

		});

		describe('when a matching item can\'t be found', () => {

			beforeEach(() => {
				change.id = 999;
				response = rule.replaceItem({ id: change.id }, change);
			});

			it('should not change the collection', () => {
				expect(rule.getCollection().data.items).toEqual(data);
			});

			it('should return null for the data', () => {
				expect(response.data).toBe(null);
			});

			it('should return a 404 status', () => {
				expect(response.status).toBe(404);
			});

		});

		it('should support a prefilter', () => {
			rule.prefilter = prefilterFunc;
			rule.replaceItem({ id: change.id }, change);
			expect(rule.getCollection().data.items).toEqual(data);
		});

		it('should support a postfilter', () => {
			rule.postfilter = postfilterFunc;
			response = rule.replaceItem({ id: change.id }, change);
			expect(response).toEqual(postfilterData);
		});

		it('should pass the original params to a postfilter', () => {
			let originalParams = { foo: 1 };
			rule.prefilter = prefilterFunc;
			rule.postfilter = postfilterFunc;
			response = rule.replaceItem(originalParams, change, null);
			expect(postfilterFunc).toHaveBeenCalledWith(originalParams, jasmine.any(Object), null);
		});

	});

	describe('reset()', () => {

		it('should replace the collection with the original data', () => {
			let changingCollection = [
				{ foo: 1 },
				{ foo: 2 }
			];
			let originalCollection = changingCollection.slice();
			rule = new MiddlewareRule(path, changingCollection);
			rule.deleteCollection();
			rule.reset();
			expect(rule.collection).toEqual(originalCollection);
		});

		it('should perform a deep clone', () => {
			let nestedObject = { foo: 3, bar: 4 };
			let changingCollection = [
				{ foo: 1 },
				nestedObject
			];
			let originalCollection = extend(true, [], changingCollection);
			rule = new MiddlewareRule(path, changingCollection);
			nestedObject.foo = 999;
			rule.reset();
			expect(rule.collection[1].foo).toEqual(originalCollection[1].foo);
		});

	});

	describe('custom handler', () => {

		let handler, expectedReturn;

		beforeEach(() => {
			expectedReturn = 'expected return value';
			handler = jasmine.createSpy('handler');
			handler.and.returnValue(expectedReturn);
			rule.handler = handler;
		});

		it('should override addItem()', () => {
			response = rule.addItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override deleteItem()', () => {
			response = rule.deleteItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override extendCollection()', () => {
			response = rule.extendCollection();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override extendItem()', () => {
			response = rule.extendItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override getCollection()', () => {
			response = rule.getCollection();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override getItem()', () => {
			response = rule.getItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

		it('should override replaceItem()', () => {
			response = rule.replaceItem();
			expect(handler).toHaveBeenCalled();
			expect(response).toBe(expectedReturn);
		});

	});

});
