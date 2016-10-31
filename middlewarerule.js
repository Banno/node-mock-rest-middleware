'use strict';

var extend = require('extend');
var pkgName = require('./package.json').name;
var sha1 = require('sha1');

module.exports = MiddlewareRule;

function MiddlewareRule(path, collection, opts) {
	this.path = path;
	this.originalCollection = extend(true, [], collection);
	this.collections = {
		default: collection
	};
	this.opts = opts || {};
	this.fingerprinting = (typeof this.opts.fingerprinting === 'undefined' ?
		true :
		Boolean(this.opts.fingerprinting)
	);
	this.paramFilters = [];

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
	this.idKey = this.opts.idKey || guessIdProp(this.collections.default[0] || {});

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

MiddlewareRule.prototype.reset = function() {
	this.collections = {
		default: extend(true, [], this.originalCollection)
	};
};

// Sets up a collection in this.collections for the given request.
// Returns the key for this.collections.
MiddlewareRule.prototype.setupCollection = function(req) {
	if (!this.fingerprinting) { return 'default'; }
	var key = req && req.headers && req.headers['user-agent'] ?
		sha1(req.headers['user-agent']) :
		'default';
	this.logger.debug('User-Agent hash is', key);
	if (!this.collections[key]) {
		this.logger.debug('Creating collection for', key);
		this.collections[key] = extend(true, [], this.originalCollection);
	}
	return key;
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
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	data = filtered.data;

	this.collections[key].push(data);
	return this.postfilter(params, {
		status: 200,
		data: data
	}, req);
};

MiddlewareRule.prototype.deleteCollection = function(params, data, req) {
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	this.prefilter(params, data, req);
	this.collections[key] = [];

	var response = {};
	response[this.collectionKey] = this.collections[key];
	response[this.countKey] = this.collections[key].length;
	return this.postfilter(params, {
		status: 200,
		data: response
	}, req);
};

MiddlewareRule.prototype.deleteItem = function(params, data, req) {
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	data = filtered.data;

	var found = null;
	// Should modify the collection in-place.
	this.collections[key].forEach(function(item, i) {
		if (areEqual(item[this.idKey], filteredParams.id)) {
			found = item;
			delete this.collections[key][i];
		}
	}.bind(this));
	return this.postfilter(params, {
		status: found ? 200 : 404,
		data: found
	}, req);
};

MiddlewareRule.prototype.extendCollection = function(params, data, req) {
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	data = filtered.data instanceof Array ? filtered.data : [filtered.data];

	var found = [];
	data.forEach(function(newItem) {
		this.collections[key].forEach(function(item, i) {
			if (areEqual(item[this.idKey], newItem[this.idKey])) {
				extend(this.collections[key][i], newItem);
				found.push(this.collections[key][i]);
			}
		}.bind(this));
	}.bind(this));
	return this.postfilter(params,  {
		status: 200,
		data: found
	}, req);
};

MiddlewareRule.prototype.extendItem = function(params, data, req) {
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	data = filtered.data;

	var found = null;
	this.collections[key].map(function(item, i) {
		if (areEqual(item[this.idKey], filteredParams.id)) {
			found = extend(this.collections[key][i], data);
			return found;
		}
	}.bind(this));
	return this.postfilter(params, {
		status: found ? 200 : 404,
		data: found
	}, req);
};

MiddlewareRule.prototype.getCollection = function(params, data, req) {
	var key = this.setupCollection(req);
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
	if (textSearch) {
		this.logger.debug('Searching for text', textSearch);
	}

	var nonSpecialParams = Object.keys(filteredParams).filter(function(key) {
		// Exclude special params.
		return specialParams.indexOf(key) === -1;
	}).filter(function(key) {
		// Exclude custom filters.
		var customFilterParams = this.paramFilters.map(function(filter) { return filter.param; });
		return customFilterParams.indexOf(key) === -1;
	}.bind(this)).filter(function(key) {
		// Exclude path params.
		if (!this.path.keys) { return true; }
		return this.path.keys.every(function(pathKeyInfo) {
			return pathKeyInfo.name !== key;
		});
	}.bind(this));
	if (nonSpecialParams.length > 0) {
		this.logger.debug('Filtering against properties', nonSpecialParams);
	}

	var filteredCollection = this.collections[key].filter(function(item) {
		var matchesAll = true;

		// Check against the text query params.
		if (textSearch) {
			matchesAll = Object.keys(item).some(function(key) {
				if (item.hasOwnProperty(key)) {
					return String(item[key]).indexOf(textSearch) > -1;
				}
				return false;
			});
		}

		// Check against any non-special query params.
		nonSpecialParams.forEach(function(key) {
			matchesAll = matchesAll && (
				typeof filteredParams[key] === 'undefined' || areEqual(item[key], filteredParams[key])
			);
		});

		// Check against any custom filters.
		this.paramFilters.forEach(function(filterInfo) {
			var val = filteredParams[filterInfo.param];
			matchesAll = matchesAll && filterInfo.filter(item, val);
		}, this);

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
	limit = limit ? parseInt(limit, 10) : this.collections[key].length;
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
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filteredInput = this.prefilter(params, data, req);
	var filteredParams = filteredInput.params;
	data = filteredInput.data;

	var filtered = this.collections[key].filter(function(item) {
		return areEqual(item[this.idKey], filteredParams.id);
	}.bind(this));
	return this.postfilter(params, {
		status: filtered.length > 0 ? 200 : 404,
		data: filtered[0]
	}, req);
};

MiddlewareRule.prototype.replaceCollection = function(params, data, req) {
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	this.collections[key] = filtered.data instanceof Array ? filtered.data : [filtered.data];
	var response = {};
	response[this.collectionKey] = this.collections[key];
	response[this.countKey] = this.collections[key].length;
	return this.postfilter(params, {
		status: 200,
		data: response
	}, req);
};

MiddlewareRule.prototype.replaceItem = function(params, data, req) {
	var key = this.setupCollection(req);
	if (this.handler) { return this.handler.apply(this, arguments); }

	var filtered = this.prefilter(params, data, req);
	var filteredParams = filtered.params;
	var found = null;
	this.collections[key].map(function(item, i) {
		if (areEqual(item[this.idKey], filteredParams.id)) {
			found = this.collections[key][i] = data;
			return found;
		}
	}.bind(this));
	return this.postfilter(params, {
		status: found ? 200 : 404,
		data: found
	}, req);
};
