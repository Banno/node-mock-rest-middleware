'use strict';
describe('fallthroughMiddleware()', () => {

	let app, req, res, next;
	const createApp = require('./test-helpers').createApp;

	beforeEach(() => {
		req = {};
		res = {};
		next = jasmine.createSpy('next');
		app = createApp();
		spyOn(app.mocks.logger, 'debug');
		app.mocks.fallthroughMiddleware(req, res, next);
	});

	it('should continue to the next middleware', () => {
		expect(next).toHaveBeenCalled();
	});

	it('should log a message', () => {
		expect(app.mocks.logger.debug).toHaveBeenCalled();
	});

});
