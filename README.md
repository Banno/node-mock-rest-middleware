# Mock REST Middleware

> Simple middleware for mocking REST services

* **Simulates** a RESTful JSON API. Uses a transient data store that can be interacted with through a typical REST API.
* **Simple and fast** to build the services.
* **Middleware** that plugs into any [Connect](https://github.com/senchalabs/connect), [Express](http://expressjs.com/), or compatible server.
* **Customizable** to change or extend how the API works.

## Usage

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
* `prefilter` -- A function that runs before every request. It receives the path+query parameters, the request body (parsed as JSON), and the raw http.ClientRequest. It should return the new input in the format `{ params: paramsObject, data: bodyDataObject }` for the normal routine to use.
* `postfilter` -- A function that runs after every request. It receives the original path+query parameters (*unfiltered* from `prefilter`), the response (in `{ status: httpResponseCode, data: responseObject, contentType: contentTypeHeader }`), and the raw http.ClientRequest. It should return the new response (in the same status+response format). If excluded, `status` defaults to `200` and `contentType` defaults to `application/json`.

Returns the new MiddlewareRule object. You can add new methods to it (or extend it) for extra/custom functionality.

### getMiddleware()

Returns an array of middleware that can be used in a Connect-compatible server.

### useWith(app)

Injects the middleware into the given Connect-compatible app.

## REST Endpoints

Given a base path of `/example`, the middleware creates the mock endpoints:

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
  * Any other parameter will filter the collection using that parameter as the field name, and performing an exact string match against the value.
* `GET /example/:id` -- Returns a single item from the collection. Returns a 404 if no match.
* `HEAD (anything)` -- Same as `GET`, but doesn't return the body.
* `POST /example` -- Adds a new item with the passed JSON body. Returns the new item.
* `PUT /example/:id` -- Replaces the matching resource with the passed JSON body. Returns the new item. Returns a 404 if no item with that ID exists.
* `DELETE /example/:id` -- Removes the matching resource from the collection. Returns the deleted resource. Returns a 404 if no item with that ID exists.
* `PATCH /example` -- Extends the matching resources using the given array of objects. It looks for an ID in each element of the array to lookup the existing items in the collection.
* `PATCH /example/:id` -- Extends the matching resource with the given object.

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
