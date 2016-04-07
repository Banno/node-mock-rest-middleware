'use strict';

var extend = require('extend');
var url = require('url');

module.exports = MiddlewareRule;

// temporarily duplicated from index.js
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

MiddlewareRule.prototype.addItem = function(data, res) {
	this.collection.push(data);
	res.writeHead(200);
	res.end(JSON.stringify(data));
};

MiddlewareRule.prototype.deleteItem = function(params, res) {
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
};

MiddlewareRule.prototype.extendCollection = function(params, data, res) {
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
};

MiddlewareRule.prototype.extendItem = function(params, data, res) {
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
};

MiddlewareRule.prototype.getCollection = function(params, res) {
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
};

MiddlewareRule.prototype.getItem = function(params, res) {
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
};

MiddlewareRule.prototype.replaceItem = function(params, data, res) {
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
};
