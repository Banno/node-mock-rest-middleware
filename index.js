'use strict';

function MiddlewareRule(path, collection) {
	if (typeof path === 'string') {
		this.path = new RegExp(path);
	} else {
		this.path = path;
	}
	this.collection = collection;
}

function Middleware() {
	this.MiddlewareRule = MiddlewareRule; // mainly for testing
	this.rules = [];
}

function getCollection(res) {
	/* jshint validthis:true */
	var data = {
		items: this.collection,
		total: this.collection.length
	};
	res.writeHead(200);
	res.end(JSON.stringify(data));
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
	return this.rules.map(function(rule) {
		return function(req, res, next) {
			if (rule.path.test(req.url)) {
				res.setHeader('Content-Type', 'application/json');
				if (req.method === 'GET') {
					getCollection.bind(rule, res)();
				}
				res.writeHead(405);
				res.end();
				return;
			}
			next();
		};
	});
};

module.exports = function() {
	return new Middleware();
};

