'use strict';

var middleware = require('../');
var connect = require('connect');
var request = require('supertest');

var path = '/foo';
var collection;

exports.createApp = function() {
	var app = connect();
	var mocks = middleware();
	collection = [{ id: 42, foo: 1, bar: 2 }, { id: 77, foo: 3, bar: 4 }];
	mocks.addResource(path, collection);
	mocks.getMiddleware().map(app.use.bind(app));
	var testApp = request(app);
	return {
		collection: collection,
		connectApp: app,
		mocks: mocks,
		path: path,
		tester: testApp
	};
};

// Needed for supertest + Jasmine.
// (https://github.com/jasmine/jasmine-npm/issues/31)
exports.finishTest = function(done) {
	return function(err) {
		if (err) {
			done.fail(err);
		} else {
			done();
		}
	};
};
