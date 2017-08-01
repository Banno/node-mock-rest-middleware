'use strict';
describe('logger', () => {

	let app;
	const createApp = require('./test-helpers').createApp;

	beforeEach(() => {
		app = createApp();
	});

	it('should exist in the middleware', () => {
		expect(app.mocks.logger).toBeDefined();
	});

	it('should have an enable() function', () => {
		expect(app.mocks.logger.enable).toEqual(jasmine.any(Function));
	});

	it('should have a disable() function', () => {
		expect(app.mocks.logger.disable).toEqual(jasmine.any(Function));
	});

});
