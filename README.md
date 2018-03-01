# couchdb-compile
Build CouchDB documents from directory, JSON or module.

[![Build
Status](https://travis-ci.org/jo/couchdb-compile.svg?branch=master)](http://travis-ci.org/jo/couchdb-compile)


## API
`compile(source[, options], callback)`

* `source` - Can be a [CouchDB Directory Tree](#the-couchdb-directory-tree) (see below), a JSON file or a CommonJS module
* `options.index` - When set to `true`, folders are searched for `index.js`, which, if present, is treated as CommonJS module. Default is `false`.
* `options.multipart` - When set to `true`, attachments are handled as multipart. Default is `false`.
* `callback` - called when done with two arguments: `error` and `doc`.

In case `options.multipart` is set, `callback` is called with a third argument:
`attachments`. This is a multipart attachments array as required by [nanos
`db.multipart.insert`](https://github.com/dscape/nano#dbmultipartinsertdoc-attachments-params-callback):

```js
{
  name: 'rabbit.png',
  content_type: 'image/png',
  data: <Buffer>
}
```
`data` can be a `Buffer` or a `String`.


### Example

```js
var compile = require('couchdb-compile');
compile('project/couchdb', function(error, doc) {
  // doc is a compile object now
});
```


## CLI

```sh
couchdb-compile [SOURCE] [OPTIONS]
```

When `SOURCE` is omitted, the current directory will be used.  
`OPTIONS` can be `--index` and `--pretty`, see above.

Use `--pretty` to get a pretty printed json output.

### Example

```sh
couchdb-compile project/couchdb
couchdb-compile project/couchdb --pretty
```

## The CouchDB Directory Tree
`couchdb-compile` uses a filesystem mapping similar to [Couchapp python
tool](https://github.com/couchapp/couchapp) and
[Erica](https://github.com/benoitc/erica):
[The Couchapp Filesystem
Mapping](https://github.com/couchapp/couchapp/wiki/Complete-Filesystem-to-Design-Doc-Mapping-Example).

It is quite self-explanatory. For example:

```sh
myapp
├── _id
├── language
└── views
    └── numbers
        ├── map.js
        └── reduce.js
```

becomes:
```json
{
  "_id": "_design/myapp",
  "language": "javascript",
  "views": {
    "numbers": {
      "map": "function...",
      "reduce": "function..."
    }
  }
}
```

See `test/fixtures` and `test/expected` for usage examples.


### IDs

If you do not include an `_id` property, the filename will be used.


### File Extensions
For property names file extensions will be stripped:

```js
{
  "validate_doc_update": "content of validate_doc_update.js",
}
```

### Attachments
Files inside the `\_attachments` directory are handled special:
They become attachment entries of the form

```js
{
  "a/file.txt": {
    "data": "SGVsbG8gV29ybGQhCg==",
    "content_type": "text/plain"
  }
}
```

The `content\_type` is computed using [mime](https://github.com/broofa/node-mime).
`data` is the base64 encoded value of the file.

Read more about [Inline
Attachments](http://wiki.apache.org/couchdb/HTTP_Document_API#Inline_Attachments).


## Tests

```sh
npm test
```

(c) 2014-2018 Johannes J. Schmidt
Apache 2.0 License
