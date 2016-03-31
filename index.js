'use strict';

var extend = require('extend');
var jsonBody = require('body/json');
var pathToRegexp = require('path-to-regexp');
var url = require('url');

function MiddlewareRule(path, collection, opts) {
	this.path = new RegExp(path);
	this.collection = collection;
	this.opts = opts || {};

	function guessIdProp(item) {
		// First look for an "id" property.
		if (typeof item.id !== 'undefined') { return 'id'; }

		// Then look for a property that ends in "Id".
		var idField = Object.keys(item).reduce(function(currentMatch, currentKey) {
			if (currentMatch) { return currentMatch; }
			if (currentKey.match(/Id$/)) { return currentKey; }
			return currentMatch;
		}, null);
		if (idField) { return idField; }

		// Otherwise use the first property.
		return Object.keys(item)[0];
	}
	this.idKey = this.opts.idKey || guessIdProp(this.collection[0] || {});
}

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

function getQueryParams(params) {
	var parsed = url.parse(params[0], true);
	return parsed.query;
}

function getCollection(params, res) {
	/* jshint validthis:true */
	var specialParams = ['limit', 'offset', 'q', 'query'];
	var urlParams = getQueryParams(params);
	var filteredCollection = this.collection.filter(function(item) {
		var matchesAll = true;

		// Check against the "query" & "q" params.
		var textSearch = urlParams.query || urlParams.q || null;
		if (textSearch) {
			matchesAll = Object.keys(item).reduce(function(prevVal, key) {
				if (item.hasOwnProperty(key)) {
					return prevVal || String(item[key]).indexOf(textSearch) > -1;
				}
				return prevVal;
			}, false);
		}

		// Check against any non-special query params.
		Object.keys(urlParams).filter(function(key) {
			return specialParams.indexOf(key) === -1;
		}).map(function(key) {
			matchesAll = matchesAll && String(item[key]) === urlParams[key];
		});

		return matchesAll;
	});
	var offset = urlParams.offset ? parseInt(urlParams.offset, 10) : 0;
	var limit = urlParams.limit ? parseInt(urlParams.limit, 10) : this.collection.length;
	var itemsSubset = filteredCollection.slice(offset, offset + limit);
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
		return String(item[this.idKey]) === id;
	}.bind(this));
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
		if (String(item[this.idKey]) === id) {
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

function extendCollection(params, data, res) {
	/* jshint validthis:true */
	var found = [];
	data.forEach(function(newItem) {
		this.collection.forEach(function(item, i) {
			if (item[this.idKey] === newItem[this.idKey]) {
				extend(this.collection[i], newItem);
				found.push(this.collection[i]);
			}
		}.bind(this));
	}.bind(this));
	if (found) {
		res.writeHead(200);
		res.end(JSON.stringify(found));
	} else {
		res.writeHead(404);
		res.end();
	}
}

function extendItem(params, data, res) {
	/* jshint validthis:true */
	var id = getId(params);
	var found = null;
	this.collection.map(function(item, i) {
		if (String(item[this.idKey]) === id) {
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
		if (String(item[this.idKey]) === id) {
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
						if (getId(params)) {
							extendItem.bind(rule, params, body, res)();
						} else {
							extendCollection.bind(rule, params, body, res)();
						}
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

Middleware.prototype.useWith = function(app) {
	this.getMiddleware().map(app.use.bind(app));
};

module.exports = function() {
	return new Middleware();
};

