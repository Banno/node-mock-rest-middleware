'use strict';
describe('resetMiddleware()', function() {

	var app, req, res, next;
	var createApp = require('./test-helpers').createApp;

	beforeEach(function() {
		req = {};
		res = {
			end: jasmine.createSpy('end')
		};
		next = jasmine.createSpy('next');
		app = createApp();
		spyOn(app.rule, 'reset');
		spyOn(app.mocks.logger, 'info');
	});

	describe('when the url is "/_reset"', function() {

		beforeEach(function() {
			req.url = '/_reset';
			app.mocks.resetMiddleware(req, res, next);
		});

		it('should log a message', function() {
			expect(app.mocks.logger.info).toHaveBeenCalled();
		});

		it('should call reset() on the underlying rule', function() {
			expect(app.rule.reset).toHaveBeenCalled();
		});

		it('should return a success message', function() {
			expect(res.end).toHaveBeenCalledWith(jasmine.any(String));
		});

		it('should NOT continue to the next middleware', function() {
			expect(next).not.toHaveBeenCalled();
		});

	});

	describe('when the url is NOT "/_reset"', function() {

		beforeEach(function() {
			req.url = '/foobar';
			app.mocks.resetMiddleware(req, res, next);
		});

		it('should continue to the next middleware', function() {
			expect(next).toHaveBeenCalled();
		});

		it('should not do anything else', function() {
			expect(app.mocks.logger.info).not.toHaveBeenCalled();
			expect(app.rule.reset).not.toHaveBeenCalled();
			expect(res.end).not.toHaveBeenCalled();
		});

	});

});
