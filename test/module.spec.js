'use strict';
describe('module', () => {

	const middleware = require('../');

	it('should return a function', () => {
		expect(middleware).toEqual(jasmine.any(Function));
	});

	it('should return an object when invoked', () => {
		expect(middleware()).toEqual(jasmine.any(Object));
	});

	it('should return a new instance every time it is invoked', () => {
		const obj1 = middleware();
		const obj2 = middleware();
		expect(obj1).not.toBe(obj2);
	});

});
