'use strict';
describe('getMiddleware()', function() {

	var app;
	var async = require('async');
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

	describe('GET /path', function() {

		it('should respond with an object with "items" and "total" data', function(done) {
			app.tester.get(app.path).end(function(err, res) {
				// Supertest is pretty broken, so we have to do this in end().
				// See https://github.com/visionmedia/supertest/issues/253
				if (typeof res.body !== 'object') { finishTest(done)('body is not an object'); }
				if (!jasmine.matchersUtil.equals(res.body.items, app.collection)) {
					finishTest(done)('"items" is not the collection');
				}
				if (res.body.total !== app.collection.length) {
					finishTest(done)('"total" is not the length of the collection');
				}
				finishTest(done)(err);
			});
		});

		it('should respond with a 200 code', function(done) {
			app.tester.get(app.path).expect(200, finishTest(done));
		});

		it('should respond with an application/json type', function(done) {
			app.tester.get(app.path).expect('Content-Type', 'application/json', finishTest(done));
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

		it('should add the item to the collection', function(done) {
			async.series([
				function(cb) { post().end(cb); },
				function(cb) { app.tester.get(app.path + '/' + newItem.id).expect(newItem, cb); },
			], finishTest(done));
		});

		it('should respond with a 200 code', function(done) {
			post().expect(200, finishTest(done));
		});

		it('should respond with an application/json type', function(done) {
			post().expect('Content-Type', 'application/json', finishTest(done));
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

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.get(app.path + '/nonexistent').expect(404, finishTest(done));
			});

		});

	});

	describe('PUT /path/:id', function() {

		var newItem;

		beforeEach(function() {
			newItem = extend({}, app.collection[0]);
			newItem.foo = 999;
			delete newItem.bar;
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

			it('should replace the existing object', function(done) {
				async.series([
					function(cb) { put().end(cb); },
					function(cb) { app.tester.get(path).expect(newItem, cb); },
				], finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				put().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				put().expect('Content-Type', 'application/json', finishTest(done));
			});

		});

		describe('when an item with that ID cannot be found', function() {

			it('should respond with a 404 code', function(done) {
				app.tester.put(app.path + '/nonexistent').send({}).expect(404, finishTest(done));
			});

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

			it('should replace the existing object', function(done) {
				async.series([
					function(cb) { patch().end(cb); },
					function(cb) { app.tester.get(path).expect(expectedItem, cb); },
				], finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				patch().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				patch().expect('Content-Type', 'application/json', finishTest(done));
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

			it('should remove the matching object', function(done) {
				async.series([
					function(cb) { del().end(cb); },
					function(cb) { app.tester.get(path).expect(404, cb); },
				], finishTest(done));
			});

			it('should respond with a 200 code', function(done) {
				del().expect(200, finishTest(done));
			});

			it('should respond with an application/json type', function(done) {
				del().expect('Content-Type', 'application/json', finishTest(done));
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
