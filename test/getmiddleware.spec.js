'use strict';
describe('getMiddleware()', () => {

	let app;
	const extend = require('extend');
	const finishTest = require('./test-helpers').finishTest;
	const createApp = require('./test-helpers').createApp;

	beforeEach(() => {
		app = createApp();
	});

	it('should return an array of functions', () => {
		expect(Array.isArray(app.mocks.getMiddleware())).toBe(true);
		expect(app.mocks.getMiddleware()[0]).toEqual(jasmine.any(Function));
	});

	it('should work with Connect', () => {
		const http = require('http');
		expect(() => {
			http.createServer(app.connectApp);
		}).not.toThrow();
	});

	it('should allow a Content-Type response header to be specified', (done) => {
		const customContentType = 'text/plain';
		spyOn(app.mocks.logger, 'warn');
		app.rule.postfilter = function(params, response) {
			response.contentType = customContentType;
			return response;
		};
		app.tester.get(app.path).expect('Content-Type', customContentType).end((err, res) => {
			if (!app.mocks.logger.warn.calls.any()) { finishTest(done)('logger.warn() was not called'); }
			finishTest(done)(err);
		});

	});

	it('should allow arbitrary response headers to be specified', (done) => {
		const headers = {
			'Content-Type': 'text/plain',
			'Content-Disposition': 'attachment; filename=example.txt'
		};
		app.rule.postfilter = function(params, response) {
			response.headers = headers;
			return response;
		};
		app.tester.get(app.path)
			.expect('Content-Type', headers['Content-Type'])
			.expect('Content-Disposition', headers['Content-Disposition'], finishTest(done));
	});

	describe('GET /path', () => {

		it('should respond with a JSON object', (done) => {
			app.tester.get(app.path).end((err, res) => {
				// Supertest is pretty broken, so we have to do this in end().
				// See https://github.com/visionmedia/supertest/issues/253
				if (typeof res.body !== 'object') { finishTest(done)('body is not an object'); }
				finishTest(done)(err);
			});
		});

		it('should respond with a 200 code', (done) => {
			app.tester.get(app.path).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', (done) => {
			app.tester.get(app.path).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', (done) => {
			app.tester.get(app.path + '/').expect(200, finishTest(done));
		});

		it('should include the path params when calling the middleware', (done) => {
			let receivedParams = {};
			app.rule.handler = function(params) {
				receivedParams = params;
			};
			app.tester.get(app.path).end((err, res) => {
				expect(receivedParams.fooId).toBe(app.fooId);
				finishTest(done)(err);
			});
		});

		describe('when the collectionKey and countKey are changed', () => {

			const collectionKey = 'foo';
			const countKey = 'bar';

			beforeEach(() => {
				app = createApp({ collectionKey: collectionKey, countKey: countKey });
			});

			it('should use those keys in the response', (done) => {
				let expectedData = {};
				expectedData[collectionKey] = app.collection;
				expectedData[countKey] = app.collection.length;
				app.tester.get(app.path).expect(expectedData, finishTest(done));
			});

		});

		describe('when the special parameter names are changed', () => {

			const offsetParam = 'alt_offset';
			const limitParam = 'alt_limit';
			const queryParam = 'alt_query';
			let params;

			beforeEach(() => {
				app = createApp({
					offsetParam: offsetParam,
					limitParam: limitParam,
					queryParam: queryParam
				});
				params = {};
			});

			it('should work with a changed "offsetParam"', (done) => {
				params[offsetParam] = 1;
				let expectedData = {
					items: app.collection.slice(params[offsetParam]),
					total: app.collection.length
				};
				app.tester.get(app.path).query(params).expect(expectedData, finishTest(done));
			});

			it('should work with a changed "limitParam"', (done) => {
				params[limitParam] = 1;
				let expectedData = {
					items: app.collection.slice(0, params[limitParam]),
					total: app.collection.length
				};
				app.tester.get(app.path).query(params).expect(expectedData, finishTest(done));
			});

			it('should work with a changed "queryParam"', (done) => {
				params[queryParam] = '42';
				let expectedData = {
					items: app.collection.slice(0, 1),
					total: 1
				};
				app.tester.get(app.path).query(params).expect(expectedData, finishTest(done));
			});

		});

		describe('when parameters are specified', () => {

			let offset, limit, expectedData;

			beforeEach(() => {
				offset = 1;
				limit = 1;
				let slicedData = app.collection.slice(offset, offset + limit);
				expectedData = {
					items: slicedData,
					total: app.collection.length
				};
			});

			it('should respond with a slice of the data', (done) => {
				app.tester.get(app.path).query({ offset: offset, limit: limit }).expect(expectedData, finishTest(done));
			});

			it('should work with a trailing slash in the path', (done) => {
				app.tester.get(app.path + '/')
					.query({ offset: offset, limit: limit })
					.expect(expectedData, finishTest(done));
			});

		});

	});

	describe('HEAD /path', () => {

		it('should respond with no data', (done) => {
			app.tester.head(app.path).expect('', finishTest(done));
		});

		it('should respond with a 200 code', (done) => {
			app.tester.head(app.path).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', (done) => {
			app.tester.head(app.path).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', (done) => {
			app.tester.head(app.path + '/').expect('', finishTest(done));
		});

		it('should include the path params when calling the middleware', (done) => {
			let receivedParams = {};
			app.rule.handler = function(params) {
				receivedParams = params;
			};
			app.tester.head(app.path).end((err, res) => {
				expect(receivedParams.fooId).toBe(app.fooId);
				finishTest(done)(err);
			});
		});

	});

	describe('POST /path', () => {

		const newItem = { id: 1, foo: 2, bar: 3 };
		let post;

		beforeEach(() => {
			post = function() {
				return app.tester.post(app.path).send(newItem);
			};
		});

		it('should respond with the same item', (done) => {
			post().expect(newItem, finishTest(done));
		});

		it('should respond with a 200 code', (done) => {
			post().expect(200, finishTest(done));
		});

		it('should respond with an application/json type', (done) => {
			post().expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', (done) => {
			app.tester.post(app.path + '/').send(newItem).expect(newItem, finishTest(done));
		});

		it('should include the path params when calling the middleware', (done) => {
			let receivedParams = {};
			app.rule.handler = function(params) {
				receivedParams = params;
			};
			post().end((err, res) => {
				expect(receivedParams.fooId).toBe(app.fooId);
				finishTest(done)(err);
			});
		});

	});

	describe('GET /path/:id', () => {

		describe('when an item with that ID exists', () => {

			let path;

			beforeEach(() => {
				path = app.path + '/' + app.collection[0].id;
			});

			it('should respond with the matching object', (done) => {
				app.tester.get(path).expect(app.collection[0], finishTest(done));
			});

			it('should respond with a 200 code', (done) => {
				app.tester.get(path).expect(200, finishTest(done));
			});

			it('should respond with an application/json type', (done) => {
				app.tester.get(path).expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', (done) => {
				app.tester.get(path + '/').expect(app.collection[0], finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', () => {

			it('should respond with a 404 code', (done) => {
				app.tester.get(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('HEAD /path/:id', () => {

		describe('when an item with that ID exists', () => {

			let path;

			beforeEach(() => {
				path = app.path + '/' + app.collection[0].id;
			});

			it('should respond with no data', (done) => {
				app.tester.head(path).expect('', finishTest(done));
			});

			it('should respond with a 200 code', (done) => {
				app.tester.head(path).expect(200, finishTest(done));
			});

			it('should respond with an application/json type', (done) => {
				app.tester.head(path).expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', (done) => {
				app.tester.head(app.path + '/').expect('', finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', () => {

			it('should respond with a 404 code', (done) => {
				app.tester.head(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('PUT /path', () => {

		let newCollection, expectedData, put;

		beforeEach(() => {
			newCollection = app.collection.slice();
			newCollection[0].foo = 999;

			expectedData = {
				items: newCollection,
				total: newCollection.length
			};

			put = function() {
				return app.tester.put(app.path).send(newCollection);
			};
		});

		it('should respond with the new collection', (done) => {
			put().expect(expectedData, finishTest(done));
		});

		it('should respond with a 200 code', (done) => {
			put().expect(200, finishTest(done));
		});

		it('should respond with an application/json type', (done) => {
			put().expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', (done) => {
			app.tester.put(app.path + '/').send(newCollection).expect(expectedData, finishTest(done));
		});

		it('should include the path params when calling the middleware', (done) => {
			let receivedParams = {};
			app.rule.handler = function(params) {
				receivedParams = params;
			};
			app.tester.put(app.path).send(newCollection).end((err, res) => {
				expect(receivedParams.fooId).toBe(app.fooId);
				finishTest(done)(err);
			});
		});

	});

	describe('PUT /path/:id', () => {

		let newItem;

		beforeEach(() => {
			newItem = extend({}, app.collection[0], { foo: 999, bar: undefined });
		});

		describe('when an item with that ID exists', () => {

			let path, put;

			beforeEach(() => {
				path = app.path + '/' + app.collection[0].id;
				put = function() {
					return app.tester.put(path).send(newItem);
				};
			});

			it('should respond with the new object', (done) => {
				put().expect(newItem, finishTest(done));
			});

			it('should respond with a 200 code', (done) => {
				put().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', (done) => {
				put().expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', (done) => {
				app.tester.put(path + '/').send(newItem).expect(newItem, finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', () => {

			it('should respond with a 404 code', (done) => {
				app.tester.put(app.path + '/nonexistent').send({}).expect(404, finishTest(done));
			});

		});

	});

	describe('PATCH /path', () => {

		let newItems, expectedItems;

		beforeEach(() => {
			newItems = [
				extend({}, app.collection[0], { foo: 7, bar: undefined }),
				extend({}, app.collection[1], { baz: 'new prop' })
			];
			expectedItems = [
				extend({}, app.collection[0], newItems[0]),
				extend({}, app.collection[1], newItems[1])
			];
		});

		it('should respond with the updated objects', (done) => {
			app.tester.patch(app.path).send(newItems).expect(expectedItems, finishTest(done));
		});

		it('should respond with a 200 code', (done) => {
			app.tester.patch(app.path).send(newItems).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', (done) => {
			app.tester.patch(app.path).send(newItems).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', (done) => {
			app.tester.patch(app.path + '/').send(newItems).expect(expectedItems, finishTest(done));
		});

		it('should include the path params when calling the middleware', (done) => {
			let receivedParams = {};
			app.rule.handler = function(params) {
				receivedParams = params;
			};
			app.tester.patch(app.path).send(newItems).end((err, res) => {
				expect(receivedParams.fooId).toBe(app.fooId);
				finishTest(done)(err);
			});
		});

	});

	describe('PATCH /path/:id', () => {

		let newItem, expectedItem;

		beforeEach(() => {
			newItem = extend({}, app.collection[0]);
			newItem.foo = 999;
			delete newItem.bar;
			expectedItem = extend({}, app.collection[0], newItem);
		});

		describe('when an item with that ID exists', () => {

			let path, patch;

			beforeEach(() => {
				path = app.path + '/' + app.collection[0].id;
				patch = function() {
					return app.tester.patch(path).send(newItem);
				};
			});

			it('should respond with the updated object', (done) => {
				patch().expect(expectedItem, finishTest(done));
			});

			it('should respond with a 200 code', (done) => {
				patch().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', (done) => {
				patch().expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', (done) => {
				app.tester.patch(path + '/').send(newItem).expect(expectedItem, finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', () => {

			it('should respond with a 404 code', (done) => {
				app.tester.put(app.path + '/nonexistent').send({}).expect(404, finishTest(done));
			});

		});

	});

	describe('DELETE /path', () => {

		const expectedData = {
			items: [],
			total: 0
		};

		it('should respond with an empty collection', (done) => {
			app.tester.delete(app.path).expect(expectedData, finishTest(done));
		});

		it('should respond with a 200 code', (done) => {
			app.tester.delete(app.path).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', (done) => {
			app.tester.delete(app.path).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', (done) => {
			app.tester.delete(app.path + '/').expect(expectedData, finishTest(done));
		});

		it('should include the path params when calling the middleware', (done) => {
			let receivedParams = {};
			app.rule.handler = function(params) {
				receivedParams = params;
			};
			app.tester.delete(app.path).end((err, res) => {
				expect(receivedParams.fooId).toBe(app.fooId);
				finishTest(done)(err);
			});
		});

	});

	describe('DELETE /path/:id', () => {

		describe('when an item with that ID exists', () => {

			let path, del, oldItem;

			beforeEach(() => {
				path = app.path + '/' + app.collection[0].id;
				oldItem = extend({}, app.collection[0]);
				del = function() {
					return app.tester.delete(path);
				};
			});

			it('should respond with the deleted object', (done) => {
				del().expect(oldItem, finishTest(done));
			});

			it('should respond with a 200 code', (done) => {
				del().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', (done) => {
				del().expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', (done) => {
				app.tester.delete(path + '/').expect(oldItem, finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', () => {

			it('should respond with a 404 code', (done) => {
				app.tester.delete(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('unknown methods', () => {

		it('should respond with a 405 code', (done) => {
			app.tester.options(app.path).expect(405, finishTest(done));
		});

	});

	describe('when a Content-Type header is set on the request', () => {

		it('should allow application/json', (done) => {
			app.tester.post(app.path)
				.type('application/json')
				.send({ foobar: '42' })
				.expect(200, finishTest(done));
		});

		it('should allow application/x-www-form-urlencoded', (done) => {
			app.tester.post(app.path)
				.type('application/x-www-form-urlencoded')
				.send({ foobar: '42' })
				.expect(200, finishTest(done));
		});

		it('should not allow other types', (done) => {
			app.tester.post(app.path)
				.type('application/x-foobar')
				.send('foobar')
				.expect(400, finishTest(done));
		});

	});

});
