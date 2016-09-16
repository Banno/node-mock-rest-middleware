'use strict';
describe('module', function() {

	var middleware = require('../');

	it('should return a function', function() {
		expect(middleware).toEqual(jasmine.any(Function));
	});

	it('should return an object when invoked', function() {
		expect(middleware()).toEqual(jasmine.any(Object));
	});

	it('should return a new instance every time it is invoked', function() {
		var obj1 = middleware();
		var obj2 = middleware();
		expect(obj1).not.toBe(obj2);
	});

	describe('options', function() {

		it('should default to empty options', function() {
			expect(middleware().opts).toEqual({});
		});

		it('should accept an options object as an argument', function() {
			expect(middleware({ foo: true }).opts.foo).toBe(true);
		});

		it('should pass the options along to addResource()', function() {
			var m = middleware({ fingerprinting: false });
			var rule = m.addResource('/foo', []);
			expect(rule.fingerprinting).toBe(false);
		});

	});

});
