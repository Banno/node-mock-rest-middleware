'use strict';

var extend = require('extend');
var jsonBody = require('body/json');
var pathToRegexp = require('path-to-regexp');
var url = require('url');

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

function getQueryParams(params) {
	var parsed = url.parse(params[0], true);
	return parsed.query;
}

function getCollection(params, res) {
	/* jshint validthis:true */
	var urlParams = getQueryParams(params);
	var offset = urlParams.offset ? parseInt(urlParams.offset, 10) : 0;
	var limit = urlParams.limit ? parseInt(urlParams.limit, 10) : this.collection.length;
	var itemsSubset = this.collection.slice(offset, offset + limit);
	var data = {
		items: itemsSubset,
		total: itemsSubset.length
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

function deleteItem(params, res) {
	/* jshint validthis:true */
	var id = getId(params);
	var found = null;
	this.collection = this.collection.filter(function(item, i) {
		if (String(item.id) === id) {
			found = item;
			return false;
		}
		return true;
	}.bind(this));
	if (found) {
		res.writeHead(200);
		res.end(JSON.stringify(found));
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

function extendItem(params, data, res) {
	/* jshint validthis:true */
	var id = getId(params);
	var found = null;
	this.collection.map(function(item, i) {
		if (String(item.id) === id) {
			found = extend(this.collection[i], data);
			return found;
		}
	}.bind(this));
	if (found) {
		res.writeHead(200);
		res.end(JSON.stringify(found));
	} else {
		res.writeHead(404);
		res.end();
	}
}

function replaceItem(params, data, res) {
	/* jshint validthis:true */
	var id = getId(params);
	var found = null;
	this.collection.map(function(item, i) {
		if (String(item.id) === id) {
			found = this.collection[i] = data;
			return found;
		}
	}.bind(this));
	if (found) {
		res.writeHead(200);
		res.end(JSON.stringify(found));
	} else {
		res.writeHead(404);
		res.end();
	}
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
				if (req.method === 'GET' || req.method === 'HEAD') {
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
				} else if (req.method === 'PUT') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							res.writeHead(400);
							res.end('Please send a JSON body for the request');
							return;
						}
						replaceItem.bind(rule, params, body, res)();
					});
					return;
				} else if (req.method === 'PATCH') {
					jsonBody(req, res, function(err, body) {
						if (err) {
							res.writeHead(400);
							res.end('Please send a JSON body for the request');
							return;
						}
						extendItem.bind(rule, params, body, res)();
					});
					return;
				} else if (req.method === 'DELETE') {
					deleteItem.bind(rule, params, res)();
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

