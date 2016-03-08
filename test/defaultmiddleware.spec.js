'use strict';
describe('defaultMiddleware()', function() {

	var middleware = require('../');

	var mocks, response, next;

	var runHandlers = function(req, res, next) {
		var middleware = mocks.getMiddleware();
		for (var i = 0; i < middleware.length; i++) {
			next.calls.reset();
			middleware[i](req, res, next);
			if (!next.calls.any()) {
				break;
			}
		}
	};

	beforeEach(function() {
		mocks = middleware();
		response = jasmine.createSpyObj('serverResponse', ['end', 'setHeader', 'write', 'writeHead']);
		next = jasmine.createSpy('next() callback');
		runHandlers({ url: '/nonexistent' }, response, next);
	});

	it('should respond with a 404 code', function() {
		expect(response.writeHead).toHaveBeenCalledWith(404);
	});

	it('should end the response', function() {
		expect(response.end).toHaveBeenCalled();
	});

});
