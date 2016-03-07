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

});
