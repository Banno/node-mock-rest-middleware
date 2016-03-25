'use strict';
describe('defaultMiddleware()', function() {

	var app;
	var finishTest = require('./test-helpers').finishTest;
	var createApp = require('./test-helpers').createApp;

	beforeEach(function() {
		app = createApp();
	});

	it('should respond with a 404 code', function(done) {
		app.tester.get('/nonexistent').expect(404, finishTest(done));
	});

});
