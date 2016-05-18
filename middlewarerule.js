'use strict';

var extend = require('extend');
var pkgName = require('./package.json').name;

module.exports = MiddlewareRule;

function MiddlewareRule(path, collection, opts) {
	this.path = path;
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

	// Set the collection keys, if specified.
	if (this.opts.collectionKey) { this.collectionKey = this.opts.collectionKey; }
	if (this.opts.countKey) { this.countKey = this.opts.countKey; }

	// Set the query parameters, if specified.
	function getStringOrArray(val) {
		if (Array.isArray(val)) {
			return val;
		} else if (typeof val === 'string') {
			return [val];
		}
	}
	if (this.opts.offsetParam) {
		this.offsetParams = getStringOrArray(this.opts.offsetParam);
	}
	if (this.opts.limitParam) {
		this.limitParams = getStringOrArray(this.opts.limitParam);
	}
	if (this.opts.queryParam) {
		this.queryParams = getStringOrArray(this.opts.queryParam);
	}
	if (this.opts.sortByParam) {
		this.sortByParams = getStringOrArray(this.opts.sortByParam);
	}
	if (this.opts.sortDirParam) {
		this.sortDirParams = getStringOrArray(this.opts.sortDirParam);
	}
}

MiddlewareRule.prototype.collectionKey = 'items';
MiddlewareRule.prototype.countKey = 'total';
MiddlewareRule.prototype.offsetParams = ['offset'];
MiddlewareRule.prototype.limitParams = ['limit'];
MiddlewareRule.prototype.queryParams = ['q', 'query'];
MiddlewareRule.prototype.sortByParams = ['sortBy'];
MiddlewareRule.prototype.sortDirParams = ['sortDir'];

MiddlewareRule.prototype.logger = require('minilog')(pkgName);

MiddlewareRule.prototype.prefilter = function(params, data) {
	return {
		params: params,
		data: data
	};
};

MiddlewareRule.prototype.postfilter = function(params, data) {
	return data;
};

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

// The generic handler is not used by default.
MiddlewareRule.prototype.handler = null;

MiddlewareRule.prototype.addItem = function(params, data, req) {
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	data = filtered.data;

	this.collection.push(data);
	return this.postfilter(params, {
		status: 200,
		data: data
	}, req);
};

MiddlewareRule.prototype.deleteCollection = function(params, data, req) {
	if (this.handler) { return this.handler.apply(this, arguments); }

	this.prefilter(params, data, req);
	this.collection = [];

	var response = {};
	response[this.collectionKey] = this.collection;
	response[this.countKey] = this.collection.length;
	return this.postfilter(params, {
		status: 200,
		data: response
	}, req);
};

MiddlewareRule.prototype.deleteItem = function(params, data, req) {
	if (this.handler) { return this.handler.apply(this, arguments); }

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
	if (this.handler) { return this.handler.apply(this, arguments); }

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
	if (this.handler) { return this.handler.apply(this, arguments); }

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
	if (this.handler) { return this.handler.apply(this, arguments); }

	params = params || {}; // mainly for testing; this should always be an object when used with the middleware
	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	data = filtered.data;

	// Helper function for the special parameters.
	var getFirstParamValue = function(obj, searchKeys) {
		// console.log('getFirstParamValue()', obj, searchKeys);
		for (var key in obj) {
			if (obj.hasOwnProperty(key) && searchKeys.indexOf(key) > -1) {
				return obj[key];
			}
		}
	};

	var specialParams = [].concat(
		this.offsetParams,
		this.limitParams,
		this.queryParams,
		this.sortByParams,
		this.sortDirParams
	);

	var textSearch = getFirstParamValue(filteredParams, this.queryParams) || null;

	var filteredCollection = this.collection.filter(function(item) {
		var matchesAll = true;

		// Check against the text query params.
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

	var sortBy = getFirstParamValue(filteredParams, this.sortByParams);
	if (sortBy) {
		this.logger.debug('Sorting by', sortBy);
		var sortDir = (getFirstParamValue(filteredParams, this.sortDirParams) || 'asc').toLowerCase();
		this.logger.debug('Sorting in direction', sortDir);
		filteredCollection.sort(function(a, b) {
			if (sortDir === 'desc') {
				if (a[sortBy] > b[sortBy]) { return -1; }
				if (a[sortBy] < b[sortBy]) { return 1; }
			} else {
				if (a[sortBy] < b[sortBy]) { return -1; }
				if (a[sortBy] > b[sortBy]) { return 1; }
			}
			return 0;
		});
	}

	var offset = getFirstParamValue(filteredParams, this.offsetParams);
	offset = offset ? parseInt(offset, 10) : 0;
	var limit = getFirstParamValue(filteredParams, this.limitParams);
	limit = limit ? parseInt(limit, 10) : this.collection.length;
	this.logger.debug('Returning collection of', limit, 'items, starting at offset', offset);
	var itemsSubset = filteredCollection.slice(offset, offset + limit);
	var response = {};
	response[this.collectionKey] = itemsSubset;
	response[this.countKey] = filteredCollection.length;
	return this.postfilter(params, {
		status: 200,
		data: response
	}, req);
};

MiddlewareRule.prototype.getItem = function(params, data, req) {
	if (this.handler) { return this.handler.apply(this, arguments); }

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

MiddlewareRule.prototype.replaceCollection = function(params, data, req) {
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	this.collection = filtered.data instanceof Array ? filtered.data : [filtered.data];
	var response = {};
	response[this.collectionKey] = this.collection;
	response[this.countKey] = this.collection.length;
	return this.postfilter(params, {
		status: 200,
		data: response
	}, req);
};

MiddlewareRule.prototype.replaceItem = function(params, data, req) {
	if (this.handler) { return this.handler.apply(this, arguments); }

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
