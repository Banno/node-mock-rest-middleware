'use strict';

function MiddlewareRule(path, collection) {
	this.path = path;
	this.collection = collection;
}

function Middleware() {
	this.rules = [];
}

Middleware.prototype.addResource = function(path, collection, opts) {
	opts = opts || {};
	if (typeof path === 'undefined') {
		throw new Error('A path must be passed to addResource()');
	}
	if (typeof collection === 'undefined') {
		throw new Error('A collection must be passed to addResource()');
	}

	this.rules.push(new MiddlewareRule(
		path,
		collection
	));
	return this;
};

Middleware.prototype.getMiddleware = function() {
	return [];
};

module.exports = function() {
	return new Middleware();
};

