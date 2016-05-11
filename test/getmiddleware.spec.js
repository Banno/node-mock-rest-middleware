'use strict';
describe('getMiddleware()', function() {

	var app;
	var extend = require('extend');
	var finishTest = require('./test-helpers').finishTest;
	var createApp = require('./test-helpers').createApp;

	beforeEach(function() {
		app = createApp();
	});

	it('should return an array of functions', function() {
		expect(Array.isArray(app.mocks.getMiddleware())).toBe(true);
		expect(app.mocks.getMiddleware()[0]).toEqual(jasmine.any(Function));
	});

	it('should work with Connect', function() {
		var http = require('http');
		expect(function() {
			http.createServer(app.connectApp);
		}).not.toThrow();
	});

	it('should allow a Content-Type response header to be specified', function(done) {
		var customContentType = 'text/plain';
		app.rule.postfilter = function(params, response) {
			response.contentType = customContentType;
			return response;
		};
		app.tester.get(app.path).expect('Content-Type', customContentType, finishTest(done));
	});

	describe('GET /path', function() {

		it('should respond with a JSON object', function(done) {
			app.tester.get(app.path).end(function(err, res) {
				// Supertest is pretty broken, so we have to do this in end().
				// See https://github.com/visionmedia/supertest/issues/253
				if (typeof res.body !== 'object') { finishTest(done)('body is not an object'); }
				finishTest(done)(err);
			});
		});

		it('should respond with a 200 code', function(done) {
			app.tester.get(app.path).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', function(done) {
			app.tester.get(app.path).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', function(done) {
			app.tester.get(app.path + '/').expect(200, finishTest(done));
		});

		describe('when parameters are specified', function() {

			var offset, limit, expectedData;

			beforeEach(function() {
				offset = 1;
				limit = 1;
				var slicedData = app.collection.slice(offset, offset + limit);
				expectedData = {
					items: slicedData,
					total: app.collection.length
				};
			});

			it('should respond with a slice of the data', function(done) {
				app.tester.get(app.path).query({ offset: offset, limit: limit }).expect(expectedData, finishTest(done));
			});

			it('should work with a trailing slash in the path', function(done) {
				app.tester.get(app.path + '/').query({ offset: offset, limit: limit }).expect(expectedData, finishTest(done));
			});

		});

	});

	describe('HEAD /path', function() {

		it('should respond with no data', function(done) {
			app.tester.head(app.path).expect('', finishTest(done));
		});

		it('should respond with a 200 code', function(done) {
			app.tester.head(app.path).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', function(done) {
			app.tester.head(app.path).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', function(done) {
			app.tester.head(app.path + '/').expect('', finishTest(done));
		});

	});

	describe('POST /path', function() {

		var newItem = { id: 1, foo: 2, bar: 3 };
		var post;

		beforeEach(function() {
			post = function() {
				return app.tester.post(app.path).send(newItem);
			};
		});

		it('should respond with the same item', function(done) {
			post().expect(newItem, finishTest(done));
		});

		it('should respond with a 200 code', function(done) {
			post().expect(200, finishTest(done));
		});

		it('should respond with an application/json type', function(done) {
			post().expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', function(done) {
			app.tester.post(app.path + '/').send(newItem).expect(newItem, finishTest(done));
		});

	});

	describe('GET /path/:id', function() {

		describe('when an item with that ID exists', function() {

			var path;

			beforeEach(function() {
				path = app.path + '/' + app.collection[0].id;
			});

			it('should respond with the matching object', function(done) {
				app.tester.get(path).expect(app.collection[0], finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				app.tester.get(path).expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				app.tester.get(path).expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', function(done) {
				app.tester.get(path + '/').expect(app.collection[0], finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.get(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('HEAD /path/:id', function() {

		describe('when an item with that ID exists', function() {

			var path;

			beforeEach(function() {
				path = app.path + '/' + app.collection[0].id;
			});

			it('should respond with no data', function(done) {
				app.tester.head(path).expect('', finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				app.tester.head(path).expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				app.tester.head(path).expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', function(done) {
				app.tester.head(app.path + '/').expect('', finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.head(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('PUT /path/:id', function() {

		var newItem;

		beforeEach(function() {
			newItem = extend({}, app.collection[0],	{ foo: 999, bar: undefined });
		});

		describe('when an item with that ID exists', function() {

			var path, put;

			beforeEach(function() {
				path = app.path + '/' + app.collection[0].id;
				put = function() {
					return app.tester.put(path).send(newItem);
				};
			});

			it('should respond with the new object', function(done) {
				put().expect(newItem, finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				put().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				put().expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', function(done) {
				app.tester.put(path + '/').send(newItem).expect(newItem, finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.put(app.path + '/nonexistent').send({}).expect(404, finishTest(done));
			});

		});

	});

	describe('PATCH /path', function() {

		var newItems, expectedItems;

		beforeEach(function() {
			newItems = [
				extend({}, app.collection[0], { foo: 7, bar: undefined }),
				extend({}, app.collection[1], { baz: 'new prop' })
			];
			expectedItems = [
				extend({}, app.collection[0], newItems[0]),
				extend({}, app.collection[1], newItems[1])
			];
		});

		it('should respond with the updated objects', function(done) {
			app.tester.patch(app.path).send(newItems).expect(expectedItems, finishTest(done));
		});

		it('should respond with a 200 code', function(done) {
			app.tester.patch(app.path).send(newItems).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', function(done) {
			app.tester.patch(app.path).send(newItems).expect('Content-Type', 'application/json', finishTest(done));
		});

		it('should work with a trailing slash in the path', function(done) {
			app.tester.patch(app.path + '/').send(newItems).expect(expectedItems, finishTest(done));
		});

	});

	describe('PATCH /path/:id', function() {

		var newItem, expectedItem;

		beforeEach(function() {
			newItem = extend({}, app.collection[0]);
			newItem.foo = 999;
			delete newItem.bar;
			expectedItem = extend({}, app.collection[0], newItem);
		});

		describe('when an item with that ID exists', function() {

			var path, patch;

			beforeEach(function() {
				path = app.path + '/' + app.collection[0].id;
				patch = function() {
					return app.tester.patch(path).send(newItem);
				};
			});

			it('should respond with the updated object', function(done) {
				patch().expect(expectedItem, finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				patch().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				patch().expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', function(done) {
				app.tester.patch(path + '/').send(newItem).expect(expectedItem, finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.put(app.path + '/nonexistent').send({}).expect(404, finishTest(done));
			});

		});

	});

	describe('DELETE /path/:id', function() {

		describe('when an item with that ID exists', function() {

			var path, del, oldItem;

			beforeEach(function() {
				path = app.path + '/' + app.collection[0].id;
				oldItem = extend({}, app.collection[0]);
				del = function() {
					return app.tester.delete(path);
				};
			});

			it('should respond with the deleted object', function(done) {
				del().expect(oldItem, finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				del().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				del().expect('Content-Type', 'application/json', finishTest(done));
			});

			it('should work with a trailing slash in the path', function(done) {
				app.tester.delete(path + '/').expect(oldItem, finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.delete(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('unknown methods', function() {

		it('should respond with a 405 code', function(done) {
			app.tester.options(app.path).expect(405, finishTest(done));
		});

	});

});
