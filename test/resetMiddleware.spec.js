'use strict';
describe('resetMiddleware()', () => {

	let app, req, res, next;
	const createApp = require('./test-helpers').createApp;

	beforeEach(() => {
		req = {};
		res = {
			end: jasmine.createSpy('end')
		};
		next = jasmine.createSpy('next');
		app = createApp();
		spyOn(app.rule, 'reset');
		spyOn(app.mocks.logger, 'info');
	});

	describe('when the url is "/_reset"', () => {

		beforeEach(() => {
			req.url = '/_reset';
			app.mocks.resetMiddleware(req, res, next);
		});

		it('should log a message', () => {
			expect(app.mocks.logger.info).toHaveBeenCalled();
		});

		it('should call reset() on the underlying rule', () => {
			expect(app.rule.reset).toHaveBeenCalled();
		});

		it('should return a success message', () => {
			expect(res.end).toHaveBeenCalledWith(jasmine.any(String));
		});

		it('should NOT continue to the next middleware', () => {
			expect(next).not.toHaveBeenCalled();
		});

	});

	describe('when the url is NOT "/_reset"', () => {

		beforeEach(() => {
			req.url = '/foobar';
			app.mocks.resetMiddleware(req, res, next);
		});

		it('should continue to the next middleware', () => {
			expect(next).toHaveBeenCalled();
		});

		it('should not do anything else', () => {
			expect(app.mocks.logger.info).not.toHaveBeenCalled();
			expect(app.rule.reset).not.toHaveBeenCalled();
			expect(res.end).not.toHaveBeenCalled();
		});

	});

});
