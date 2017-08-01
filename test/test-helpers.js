'use strict';

const middleware = require('../');
const connect = require('connect');
const request = require('supertest');

const path = '/foo/:fooId/bar';
let collection;

exports.createApp = function(opts) {
	opts = opts || {};
	const app = connect();
	const mocks = middleware();
	const fooId = 'fooIdValue';
	collection = [
		{ id: 42, foo: 1, bar: 2 },
		{ id: 49, foo: 5, bar: 6 },
		{ id: 77, foo: 3, bar: 4 }
	];
	const newRule = mocks.addResource(path, collection, opts);
	// mocks.logger.enable();
	mocks.useWith(app);
	const testApp = request(app);
	return {
		collection: collection,
		connectApp: app,
		mocks: mocks,
		fooId: fooId,
		path: path.replace(':fooId', fooId),
		rule: newRule,
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
