'use strict';

var extend = require('extend');
var jsonBody = require('body/json');
var MiddlewareRule = require('./middlewarerule');
var pathToRegexp = require('path-to-regexp');
var parseUrl = require('url').parse;

function Middleware() {
	this.MiddlewareRule = MiddlewareRule; // mainly for testing
	this.rules = [];
}

function getId(parsed) {
	// Check if an ID was matched.
	if (!parsed[1]) { return; }

	// Check for case where there is no ID, but there are query params.
	if (parsed[1][0] === '?') { return; }

	return parsed[1];
}

function getQueryParams(url) {
	return parseUrl(url, true).query;
}

Middleware.prototype.addResource = function(path, collection, opts) {
	opts = opts || {};
	if (typeof path === 'undefined') {
		throw new Error('A path must be passed to addResource()');
	}
	if (typeof collection === 'undefined') {
		throw new Error('A collection must be passed to addResource()');
	}

	var rule = new MiddlewareRule(
		pathToRegexp(path + '/:id?(\\?.*)?', undefined, { sensitive: true, strict: false }),
		collection,
		opts
	);
	this.rules.push(rule);

	return rule;
};

Middleware.prototype.defaultMiddleware = function(req, res, next) {
	res.writeHead(404);
	res.end();
};

Middleware.prototype.getMiddleware = function() {
	return this.rules.map(function(rule) {
		return function(req, res, next) {
			function parseParams(pathRegExp) {
				var parsed = pathRegExp.exec(req.url);
				return extend(
					getId(parsed) ? { id: getId(parsed) } : {},
					getQueryParams(parsed[0])
				);
			}
			function handleResponse(response) {
				response = response || {};
				response.status = response.status || 200;
				res.setHeader('Content-Type', 'application/json');
				res.writeHead(response.status);
				if (response.data) {
					res.end(typeof response.data === 'object' ? JSON.stringify(response.data) : response.data);
				} else {
					res.end();
				}
			}
			if (rule.path.test(req.url)) {
				var params = parseParams(rule.path);
				if (req.method === 'GET' || req.method === 'HEAD') {
					handleResponse(rule[params.id ? 'getItem' : 'getCollection'](params, null, req));
					return;
				} else if (req.method === 'POST') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							handleResponse({ status: 400, data: 'Please send a JSON body for the request' });
							return;
						}
						handleResponse(rule.addItem(params, body, req));
					});
					return;
				} else if (req.method === 'PUT') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							handleResponse({ status: 400, data: 'Please send a JSON body for the request' });
							return;
						}
						handleResponse(rule.replaceItem(params, body, req));
					});
					return;
				} else if (req.method === 'PATCH') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							handleResponse({ status: 400, data: 'Please send a JSON body for the request' });
							return;
						}
						handleResponse(rule[params.id ? 'extendItem' : 'extendCollection'](params, body, req));
					});
					return;
				} else if (req.method === 'DELETE') {
					handleResponse(rule.deleteItem(params, null, req));
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

