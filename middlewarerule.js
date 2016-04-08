'use strict';

var extend = require('extend');

module.exports = MiddlewareRule;

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

		// Otherwise use the first property, or simply "id".
		return Object.keys(item)[0] || 'id';
	}
	this.idKey = this.opts.idKey || guessIdProp(this.collection[0] || {});
}

function areEqual(a, b) {
	return String(a) === String(b);
}

//
// MiddlewareRule methods can take 1 or 2 arguments:
//   * path & query parameters, indexed by the key
//   * body data, as JSON
// They should return an object with any of the following keys:
//   * status -- the HTTP response code
//   * data -- the JSON body (null or undefined for no data)
//   * headers -- HTTP headers, keyed by their name
//

MiddlewareRule.prototype.addItem = function(data) {
	this.collection.push(data);
	return {
		status: 200,
		data: data
	};
};

MiddlewareRule.prototype.deleteItem = function(params) {
	var found = null;
	this.collection = this.collection.filter(function(item, i) {
		if (areEqual(item[this.idKey], params.id)) {
			found = item;
			return false;
		}
		return true;
	}.bind(this));
	return {
		status: found ? 200 : 404,
		data: found
	};
};

MiddlewareRule.prototype.extendCollection = function(params, data) {
	var found = [];
	data.forEach(function(newItem) {
		this.collection.forEach(function(item, i) {
			if (areEqual(item[this.idKey], newItem[this.idKey])) {
				extend(this.collection[i], newItem);
				found.push(this.collection[i]);
			}
		}.bind(this));
	}.bind(this));
	return {
		status: 200,
		data: found
	};
};

MiddlewareRule.prototype.extendItem = function(params, data) {
	var found = null;
	this.collection.map(function(item, i) {
		if (areEqual(item[this.idKey], params.id)) {
			found = extend(this.collection[i], data);
			return found;
		}
	}.bind(this));
	return {
		status: found ? 200 : 404,
		data: found
	};
};

MiddlewareRule.prototype.getCollection = function(params) {
	params = params || {};
	var specialParams = ['limit', 'offset', 'q', 'query'];
	var filteredCollection = this.collection.filter(function(item) {
		var matchesAll = true;

		// Check against the "query" & "q" params.
		var textSearch = params.query || params.q || null;
		if (textSearch) {
			matchesAll = Object.keys(item).reduce(function(prevVal, key) {
				if (item.hasOwnProperty(key)) {
					return prevVal || String(item[key]).indexOf(textSearch) > -1;
				}
				return prevVal;
			}, false);
		}

		// Check against any non-special query params.
		Object.keys(params).filter(function(key) {
			return specialParams.indexOf(key) === -1;
		}).map(function(key) {
			matchesAll = matchesAll && areEqual(item[key], params[key]);
		});

		return matchesAll;
	});
	var offset = params.offset ? parseInt(params.offset, 10) : 0;
	var limit = params.limit ? parseInt(params.limit, 10) : this.collection.length;
	var itemsSubset = filteredCollection.slice(offset, offset + limit);
	var data = {
		items: itemsSubset,
		total: filteredCollection.length
	};
	return {
		status: 200,
		data: data
	};
};

MiddlewareRule.prototype.getItem = function(params) {
	var filtered = this.collection.filter(function(item) {
		return areEqual(item[this.idKey], params.id);
	}.bind(this));
	return {
		status: filtered.length > 0 ? 200 : 404,
		data: filtered[0]
	};
};

MiddlewareRule.prototype.replaceItem = function(params, data) {
	var found = null;
	this.collection.map(function(item, i) {
		if (areEqual(item[this.idKey], params.id)) {
			found = this.collection[i] = data;
			return found;
		}
	}.bind(this));
	return {
		status: found ? 200 : 404,
		data: found
	};
};
