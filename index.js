'use strict';

var jsonBody = require('body/json');
var pathToRegexp = require('path-to-regexp');

function MiddlewareRule(path, collection) {
	this.path = new RegExp(path);
	this.collection = collection;
}

function Middleware() {
	this.MiddlewareRule = MiddlewareRule; // mainly for testing
	this.rules = [];
}

function getId(params) {
	return params[1];
}

function getCollection(params, res) {
	/* jshint validthis:true */
	var data = {
		items: this.collection,
		total: this.collection.length
	};
	res.writeHead(200);
	res.end(JSON.stringify(data));
}

function getItem(params, res) {
	/* jshint validthis:true */
	var id = getId(params);
	var filtered = this.collection.filter(function(item) {
		return String(item.id) === id;
	});
	if (filtered.length > 0) {
		res.writeHead(200);
		res.end(JSON.stringify(filtered[0]));
	} else {
		res.writeHead(404);
		res.end();
	}
}

function addItem(data, res) {
	/* jshint validthis:true */
	this.collection.push(data);
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
		pathToRegexp(path + '/:id?', undefined, { sensitive: true, strict: false }),
		collection
	));

	return this;
};

Middleware.prototype.defaultMiddleware = function(req, res, next) {
	res.writeHead(404);
	res.end();
};

Middleware.prototype.getMiddleware = function() {
	return this.rules.map(function(rule) {
		return function(req, res, next) {
			if (rule.path.test(req.url)) {
				var params = rule.path.exec(req.url);
				res.setHeader('Content-Type', 'application/json');
				if (req.method === 'GET') {
					if (getId(params)) {
						getItem.bind(rule, params, res)();
					} else {
						getCollection.bind(rule, params, res)();
					}
					return;
				} else if (req.method === 'POST') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							res.writeHead(400);
							res.end('Please send a JSON body for the request');
							return;
						}
						addItem.bind(rule, body, res)();
					});
					return;
				}
				res.writeHead(405);
				res.end();
				return;
			}
			next();
		};
	}).concat(this.defaultMiddleware);
};

module.exports = function() {
	return new Middleware();
};

