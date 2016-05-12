'use strict';

var extend = require('extend');
var pkgName = require('./package.json').name;

module.exports = MiddlewareRule;

function MiddlewareRule(path, collection, opts) {
	this.path = path;
	this.collection = collection;
	this.opts = opts || {};

	this.prefilter  = this.opts.prefilter || function(params, data) {
		return {
			params: params,
			data: data
		};
	};
	this.postfilter = this.opts.postfilter || function(params, data) {
		return data;
	};

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

MiddlewareRule.prototype.logger = require('minilog')(pkgName);

function areEqual(a, b) {
	return String(a) === String(b);
}

//
// MiddlewareRule methods have 3 arguments:
//   * path & query parameters, indexed by the key
//   * body data, as JSON (undefined/null if none)
//   * the raw request (http.ClientRequest)
// They should return an object with any of the following keys:
//   * status -- the HTTP response code
//   * data -- the JSON body (null or undefined for no data)
//   * headers -- HTTP headers, keyed by their name
//

MiddlewareRule.prototype.addItem = function(params, data, req) {
	var filtered = this.prefilter(params, data, req);
	data = filtered.data;

	this.collection.push(data);
	return this.postfilter(params, {
		status: 200,
		data: data
	}, req);
};

MiddlewareRule.prototype.deleteItem = function(params, data, req) {
	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	data = filtered.data;

	var found = null;
	this.collection = this.collection.filter(function(item, i) {
		if (areEqual(item[this.idKey], filteredParams.id)) {
			found = item;
			return false;
		}
		return true;
	}.bind(this));
	return this.postfilter(params, {
		status: found ? 200 : 404,
		data: found
	}, req);
};

MiddlewareRule.prototype.extendCollection = function(params, data, req) {
	var filtered = this.prefilter(params, data, req);
	data = filtered.data instanceof Array ? filtered.data : [filtered.data];

	var found = [];
	data.forEach(function(newItem) {
		this.collection.forEach(function(item, i) {
			if (areEqual(item[this.idKey], newItem[this.idKey])) {
				extend(this.collection[i], newItem);
				found.push(this.collection[i]);
			}
		}.bind(this));
	}.bind(this));
	return this.postfilter(params,  {
		status: 200,
		data: found
	}, req);
};

MiddlewareRule.prototype.extendItem = function(params, data, req) {
	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	data = filtered.data;

	var found = null;
	this.collection.map(function(item, i) {
		if (areEqual(item[this.idKey], filteredParams.id)) {
			found = extend(this.collection[i], data);
			return found;
		}
	}.bind(this));
	return this.postfilter(params, {
		status: found ? 200 : 404,
		data: found
	}, req);
};

MiddlewareRule.prototype.getCollection = function(params, data, req) {
	params = params || {}; // mainly for testing; this should always be an object when used with the middleware
	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	data = filtered.data;

	var specialParams = ['limit', 'offset', 'q', 'query'];
	var filteredCollection = this.collection.filter(function(item) {
		var matchesAll = true;

		// Check against the "query" & "q" params.
		var textSearch = filteredParams.query || filteredParams.q || null;
		if (textSearch) {
			this.logger.debug('Searching for text', textSearch);
			matchesAll = Object.keys(item).reduce(function(prevVal, key) {
				if (item.hasOwnProperty(key)) {
					return prevVal || String(item[key]).indexOf(textSearch) > -1;
				}
				return prevVal;
			}, false);
		}

		// Check against any non-special query params.
		Object.keys(filteredParams).filter(function(key) {
			return specialParams.indexOf(key) === -1;
		}).map(function(key) {
			matchesAll = matchesAll && areEqual(item[key], filteredParams[key]);
		});

		return matchesAll;
	}.bind(this));
	var offset = filteredParams.offset ? parseInt(filteredParams.offset, 10) : 0;
	var limit = filteredParams.limit ? parseInt(filteredParams.limit, 10) : this.collection.length;
	this.logger.debug('Returning collection of', limit, 'items, starting at offset', offset);
	var itemsSubset = filteredCollection.slice(offset, offset + limit);
	var response = {
		items: itemsSubset,
		total: filteredCollection.length
	};
	return this.postfilter(params, {
		status: 200,
		data: response
	}, req);
};

MiddlewareRule.prototype.getItem = function(params, data, req) {
	var filteredInput = this.prefilter(params, data, req);
	var filteredParams = filteredInput.params;
	data = filteredInput.data;

	var filtered = this.collection.filter(function(item) {
		return areEqual(item[this.idKey], filteredParams.id);
	}.bind(this));
	return this.postfilter(params, {
		status: filtered.length > 0 ? 200 : 404,
		data: filtered[0]
	}, req);
};

MiddlewareRule.prototype.replaceItem = function(params, data, req) {
	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	var found = null;
	this.collection.map(function(item, i) {
		if (areEqual(item[this.idKey], filteredParams.id)) {
			found = this.collection[i] = data;
			return found;
		}
	}.bind(this));
	return this.postfilter(params, {
		status: found ? 200 : 404,
		data: found
	}, req);
};
