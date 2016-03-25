'use strict';
describe('getMiddleware()', function() {

	var app;
	var async = require('async');
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

	describe('unknown methods', function() {

		it('should respond with a 405 code', function(done) {
			app.tester.options(app.path).expect(405, finishTest(done));
		});

	});

});
