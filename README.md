# couch-compile
Build CouchDB documents from directory, JSON or module.

[![Build Status](https://secure.travis-ci.org/jo/couch-compile.png?branch=master)](http://travis-ci.org/jo/couch-compile)

```js
var compile = require('couch-compile');
compile(process.args[2], function(err, doc) {
  // push
});
```

## Usage
`compile(directory, [options], callback)`

### `Options`
Currently there are no `options` supported.

### `callback`
`callback` is called with two arguments: `error` and `doc`.

### CLI
A simple commandline client is included:
```shell
npm install -g couch-compile
```

Give it a directory, or use the current one:
```shell
couch-compile path/to/couch/dir
```


## The Couch Directory Tree
`couch-compile` uses a filesystem mapping similar to [Couchapp python tool](http://couchapp.org/page/couchapp-python)
and [Erika](https://github.com/benoitc/erica):
[The Couchapp Filesystem Mapping](http://couchapp.org/page/filesystem-mapping).

It is quite self-explanatory. For example:

```shell
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

Read more about [Inline Attachments](http://wiki.apache.org/couchdb/HTTP_Document_API#Inline_Attachments).


## Testing
Run the testsuite with
```shell
npm test
```

(c) 2014 Johannes J. Schmidt, TF  
MIT License
