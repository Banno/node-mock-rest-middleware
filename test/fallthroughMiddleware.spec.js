'use strict';
describe('fallthroughMiddleware()', function() {

	var app, req, res, next;
	// var finishTest = require('./test-helpers').finishTest;
	var createApp = require('./test-helpers').createApp;

	beforeEach(function() {
		req = {};
		res = {};
		next = jasmine.createSpy('next');
		app = createApp();
		spyOn(app.mocks.logger, 'debug');
		app.mocks.fallthroughMiddleware(req, res, next);
	});

	it('should continue to the next middleware', function() {
		expect(next).toHaveBeenCalled();
	});

	it('should log a message', function() {
		expect(app.mocks.logger.debug).toHaveBeenCalled();
	});

});
