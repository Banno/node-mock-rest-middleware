'use strict';

var extend = require('extend');
var anyBody = require('body/any');
var MiddlewareRule = require('./middlewarerule');
var pathToRegexp = require('path-to-regexp');
var parseUrl = require('url').parse;
var pkgName = require('./package.json').name;

function Middleware() {
	this.MiddlewareRule = MiddlewareRule; // mainly for testing
	this.rules = [];

	var minilog = require('minilog');
	this.logger = minilog(pkgName);
	this.logger.enable = minilog.enable;
	this.logger.disable = minilog.disable;
}

function getId(parsed, pathKeys) {
	// Find the index of the :id placeholder in the path.
	var keys = Object.keys(pathKeys);
	for (var idIndex = 0; idIndex < keys.length; idIndex++) {
		if (pathKeys[keys[idIndex]].name === 'id') {
			break;
		}
	}

	// Check if an ID was matched.
	if (!parsed[idIndex + 1]) { return; }

	// Check for case where there is no ID, but there are query params.
	if (parsed[idIndex + 1][0] === '?') { return; }

	return parsed[idIndex + 1];
}

function getQueryParams(url) {
	return parseUrl(url, true).query;
}

// Note: path cannot contain an ":id" placeholder. That is reserved.
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

	this.logger.info('Added rule', path);
	this.logger.debug(rule);
	rule.logger = this.logger; // put this after the logging for less output

	return rule;
};

Middleware.prototype.fallthroughMiddleware = function(req, res, next) {
	this.logger.debug('No handler for', req.method, req.url, ', falling through to next middleware');
	next();
};

Middleware.prototype.resetMiddleware = function(req, res, next) {
	if (req.url !== '/_reset') {
		return next();
	}
	this.logger.info('Resetting rules');
	this.rules.forEach(function(rule) {
		rule.reset();
	});
	res.end('Reset successful');
};

Middleware.prototype.getMiddleware = function() {
	var logger = this.logger;
	return this.rules.map(function(rule) {
		return function(req, res, next) {
			function parseParams(pathRegExp) {
				var parsed = pathRegExp.exec(req.url);
				var mapped = pathRegExp.keys.reduce(function(soFar, key, i) {
					if (key.name !== 0 && key.name !== 'id') {
						soFar[key.name] = parsed[i + 1];
					}
					return soFar;
				}, {});
				return extend(
					mapped,
					getId(parsed, rule.path.keys) ? { id: getId(parsed, rule.path.keys) } : {},
					getQueryParams(parsed[0])
				);
			}
			function handleResponse(response) {
				logger.debug('...returning response:', response);
				response = response || {};
				response.status = response.status || 200;
				response.headers = response.headers || {};
				response.contentType = response.contentType || 'application/json';
				res.setHeader('Content-Type', response.contentType);
				Object.keys(response.headers).forEach(function(header) {
					res.setHeader(header, response.headers[header]);
				});
				res.writeHead(response.status);
				if (response.data) {
					res.end(typeof response.data === 'object' ? JSON.stringify(response.data) : response.data);
				} else {
					res.end();
				}
			}
			if (rule.path.test(req.url)) {
				logger.info(req.method, req.url);
				logger.debug('...matches pattern:', rule.path.source);
				var params = parseParams(rule.path);
				logger.debug('...parsed params:', params);
				if (req.method === 'GET' || req.method === 'HEAD') {
					handleResponse(rule[params.id ? 'getItem' : 'getCollection'](params, null, req));
					return;
				} else if (req.method === 'POST') {
					anyBody(req, res, function(err, body) {
						if (err) {
							handleResponse({ status: 400, data: 'Invalid request. ' + err.message, contentType: 'text/plain' });
							return;
						}
						handleResponse(rule.addItem(params, body, req));
					});
					return;
				} else if (req.method === 'PUT') {
					anyBody(req, res, function(err, body) {
						if (err) {
							handleResponse({ status: 400, data: 'Invalid request. ' + err.message, contentType: 'text/plain' });
							return;
						}
						handleResponse(rule[params.id ? 'replaceItem' : 'replaceCollection'](params, body, req));
					});
					return;
				} else if (req.method === 'PATCH') {
					anyBody(req, res, function(err, body) {
						if (err) {
							handleResponse({ status: 400, data: 'Invalid request. ' + err.message, contentType: 'text/plain' });
							return;
						}
						handleResponse(rule[params.id ? 'extendItem' : 'extendCollection'](params, body, req));
					});
					return;
				} else if (req.method === 'DELETE') {
					handleResponse(rule[params.id ? 'deleteItem' : 'deleteCollection'](params, null, req));
					return;
				}
				res.writeHead(405);
				res.end();
				return;
			}
			next();
		};
	}).concat(
		this.resetMiddleware.bind(this),
		this.fallthroughMiddleware.bind(this)
	);
};

Middleware.prototype.useWith = function(app) {
	this.getMiddleware().map(app.use.bind(app));
};

module.exports = function() {
	return new Middleware();
};

