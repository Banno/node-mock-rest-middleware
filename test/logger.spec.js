'use strict';
describe('logger', function() {

	var app;
	var createApp = require('./test-helpers').createApp;

	beforeEach(function() {
		app = createApp();
	});

	it('should exist in the middleware', function() {
		expect(app.mocks.logger).toBeDefined();
	});

	it('should have an enable() function', function() {
		expect(app.mocks.logger.enable).toEqual(jasmine.any(Function));
	});

	it('should have a disable() function', function() {
		expect(app.mocks.logger.disable).toEqual(jasmine.any(Function));
	});

});
