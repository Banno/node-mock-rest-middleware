'use strict';

var jsonBody = require('body/json');
var MiddlewareRule = require('./middlewarerule');
var pathToRegexp = require('path-to-regexp');

function Middleware() {
	this.MiddlewareRule = MiddlewareRule; // mainly for testing
	this.rules = [];
}

function getId(params) {
	// Check if an ID was matched.
	if (!params[1]) { return; }

	// Check for case where there is no ID, but there are query params.
	if (params[1][0] === '?') { return; }

	return params[1];
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
		pathToRegexp(path + '/:id?(\\?.*)?', undefined, { sensitive: true, strict: false }),
		collection,
		opts
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
				if (req.method === 'GET' || req.method === 'HEAD') {
					if (getId(params)) {
						rule.getItem(params, res);
					} else {
						rule.getCollection(params, res);
					}
					return;
				} else if (req.method === 'POST') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							res.writeHead(400);
							res.end('Please send a JSON body for the request');
							return;
						}
						rule.addItem(body, res);
					});
					return;
				} else if (req.method === 'PUT') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							res.writeHead(400);
							res.end('Please send a JSON body for the request');
							return;
						}
						rule.replaceItem(params, body, res);
					});
					return;
				} else if (req.method === 'PATCH') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							res.writeHead(400);
							res.end('Please send a JSON body for the request');
							return;
						}
						if (getId(params)) {
							rule.extendItem(params, body, res);
						} else {
							rule.extendCollection(params, body, res);
						}
					});
					return;
				} else if (req.method === 'DELETE') {
					rule.deleteItem(params, res);
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

Middleware.prototype.useWith = function(app) {
	this.getMiddleware().map(app.use.bind(app));
};

module.exports = function() {
	return new Middleware();
};

