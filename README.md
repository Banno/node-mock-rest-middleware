# Mock REST Middleware

> Simple middleware for mocking REST services

* **Simulates** a RESTful JSON API. Uses a transient data store that can be interacted with through a typical REST API.
* **Simple and fast** to build the services.
* **Middleware** that plugs into any [Connect](https://github.com/senchalabs/connect), [Express](http://expressjs.com/), or compatible server.
* **Customizable** to change or extend how the API works.

## Usage

Node.js v6 or higher is required.

First install the module:

```shell
npm install mock-rest-middleware
```

Then use it in your Connect/Express app:

```javascript
var connect = require('connect');
var http = require('http');

var createMocks = require('mock-rest-middleware');
var mocks = createMocks();

var bookCollection = [];
var movieCollection = [];
mocks.addResource('/books', bookCollection);
mocks.addResource('/movies', movieCollection);

var app = connect();
mocks.useWith(app);
http.createServer(app);
```

## API

### addResource(path, collection, options)

Adds a new resource at the given path. The path can include placeholders, e.g. `/foo/:someId`.

**Note:** The path *cannot* contain an `:id` placeholder; that is reserved for use by the module.

The collection argument should be the array of data that the endpoint begins with.

The optional `options` object may contain:

* `idKey` -- The name of the ID field. If not specified, the library will use the `id` field, or the first field that ends in `Id`, or the first field.
* `collectionKey` -- The property name for the collection response (default `items`).
* `countKey` -- The property name for the collection response (default `total`).
* `offsetParam` -- The name(s) to use for the "offset" query parameter when retrieving a collection subset (string or array of strings, default `offset`).
* `limitParam` -- The name(s) to use for the "limit" query parameter when retrieving a collection subset (string or array of strings, default `limit`).
* `queryParam` -- The name(s) to use for the query parameter when performing a collection text search (string or array of strings, default `['q', 'query']`).
* `sortByParam` -- The name(s) to use for the field parameter when sorting collection results (string or array of strings, default `['sortBy']`).
* `sortDirParam` -- The name(s) to use for the direction parameter when sorting collection results (string or array of strings, default `['sortDir']`).

These options can also be changed in the rule object after it is created.

The following properties can only be changed on the rule object *after* it is created.

* `paramFilters` -- An array of filters used when filtering the collection during `GET /path`. Each item in the array should have the following pattern:

  ```javascript
  {
    param: 'pathOrQueryParamName',
    filter: function(item, paramValue) { /* return true if the item passes the test */ }
  }
  ```

  These filters are added to the normal filtering for `GET /path?params` -- i.e., it is intersected with the other results.

* `prefilter` -- A function that runs before every request. It receives the path+query parameters, the request body (parsed as JSON), and the raw http.ClientRequest. It should return the new input in the format `{ params: paramsObject, data: bodyDataObject }` for the normal routine to use. Note you should clone any objects you change, rather than modifying them.
* `postfilter` -- A function that runs after every request. It receives the original path+query parameters (*unfiltered* from `prefilter`), the response (in `{ status: httpResponseCode, data: responseObject, headers: headersObject }`), and the raw http.ClientRequest. It should return the new response (in the same status+response format). If excluded, `status` defaults to `200` and `headers` defaults to `{ 'Content-Type': 'application/json' }`.
* `handler` -- A function to use for all requests. *Overrides all of the default handling! You'll need to check the request method and run the prefilter/postfilter functions yourself.*  Receives the same arguments as `prefilter`. It should return a response in the same format as `postfilter`.

Returns the new MiddlewareRule object. You can add new methods to it (or extend it) for extra/custom functionality.

### getMiddleware()

Returns an array of middleware that can be used in a Connect-compatible server.

### logger.enable()
### logger.disable()

Turns logging on or off (begins disabled). Useful when debugging your rules.

### useWith(app)

Injects the middleware into the given Connect-compatible app.

## REST Endpoints

Given a base path of `/example`, the middleware creates the mock endpoints:

* `/_reset` (any method) -- Special endpoint to return all collections to their original data.
* `GET /example` -- Returns the full collection, in the format:

  ```javascript
  {
    items: [
      // array of objects
    ],
    total: 20 // the number of items
  }
  ```

* `GET /example?params` -- Returns a filtered collection. Same as above, but:
  * `offset` (zero-based) and `limit` parameters will return only a subset of the collection. Note: the returned `total` will remain the size of full collection.
  * `query` or `q` parameters will perform a partial text search. Note: All values are converted to strings for matching.
  * `sortBy` and `sortDir` will sort the results by the top-level property specified in `sortBy`, in the direction specified by `sortDir` -- either case-insensitive `asc` (the default), or `desc` for reversed sorting.
  * Any other parameter will filter the collection using that parameter as the field name, and performing an exact string match against the value.
* `GET /example/:id` -- Returns a single item from the collection. Returns a 404 if no match.
* `HEAD (anything)` -- Same as `GET`, but doesn't return the body.
* `POST /example` -- Adds a new item with the passed JSON body. Returns the new item.
* `PUT /example` -- Replaces the entire collection with the passed JSON body. Returns the new collection.
* `PUT /example/:id` -- Replaces the matching resource with the passed JSON body. Returns the new item. Returns a 404 if no item with that ID exists.
* `DELETE /example` -- Empties the collection. Returns the empty collection.
* `DELETE /example/:id` -- Removes the matching resource from the collection. Returns the deleted resource. Returns a 404 if no item with that ID exists.
* `PATCH /example` -- Extends the matching resources using the given array of objects. It looks for an ID in each element of the array to lookup the existing items in the collection.
* `PATCH /example/:id` -- Extends the matching resource with the given object.

Don't forget to set `Content-Type: application/json` in your requests. Form data (`Content-Type: application/x-www-form-urlencoded`) are also supported.

## Tips

* Turn on logging (with `logging.enable()`) to debug your rules.
* Call the `/_reset` endpoint to reset your data.
* Remember that the collection passed to `addResource()` must be an array (or array-like object), not an object.
* The middleware uses the same path matching as [Connect](https://github.com/senchalabs/connect#mount-middleware) -- that is, the path only has to match the beginning of the URL path. The middleware uses the first resource that matches, so more specific paths must be defined first:

  ```javascript
  // In this example, /passwords/validate must come first.
  // Otherwise the /passwords endpoint will always be used instead.
  mockMiddleware.addResource('/passwords/validate', []);
  mockMiddleware.addResource('/passwords', []);
  ```

* Start with the [built-in behavior](README.md#rest-endpoints). If needed, tweak the [`addResource()` options](README.md#addresourcepath-collection-options) (`idKey`, `collectionKey`, etc). Minor changes to the default behavior can be achieved with [`paramFilters`, `prefilter`, and `postfilter`](README.md#addresourcepath-collection-options). Individual endpoints can be overridden by redefining [the MiddlewareRule methods](https://github.com/Banno/node-mock-rest-middleware/blob/master/middlewarerule.js) (`addItem()`, `deleteCollection()`, etc). Finally, you can set a [`handler()` method](README.md#addresourcepath-collection-options) to override *all* of the endpoints.
* For testing, you can create a simple server (see [Usage](README.md#usage)) to run your mocks. Then you can test the endpoints using any HTTP client (such as curl, [http-console](https://www.npmjs.com/package/http-console), or [Postman](https://www.getpostman.com/)).
* Always *modify* a resource's collection. Don't replace it.

  ```javascript
  yourRule.handler = function() {
    // BAD. These create new arrays that replace the collection.
    this.collection = this.collection.map(function(item) { /* ... */ });
    this.collection = this.collection.filter(function(item) { /* ... */ });

    // GOOD. This modifies the array in place.
    this.collection.forEach(function(item, i) {
      this.collection[i].someProperty = true;
    }, this);
  };
  ```

* Need to share a collection between multiple endpoints? You can point to another collection during a reset:

  ```javascript
  var animalRule = mockMiddleware.addResource('/animals', animalCollection);
  var petRule = mockMiddleware.addResource('/pets', []);
  petRule.reset = function() {
    this.collection = animalRule.collection;
  };
  petRule.reset();
  ```

* In your project, use the included `test-mock-server.js` script to start a test server using your mocks:

  ```
  ./node_modules/.bin/test-mock-server ./mocks
  ```

## Contributing

Please add tests and maintain the existing styling when adding and updating the code.

```
npm run lint  # run linting
npm test      # run tests
```

## License

Copyright 2016 [Jack Henry & Associates Inc](https://www.jackhenry.com/).

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0).

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
