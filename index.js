// couch-compile
// (c) 2014 Johannes J. Schmidt

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var mime = require('mime');
var async = require('async');

var RESERVED_DOCID_PREFIXES = ['_design', '_local'];


// Recursively transform an object into a JSON compatible representation
// and preserve methods by calling toString() on the function objects.
function objToJson(obj) {
  return Object.keys(obj).reduce(function(memo, key) {
    if (typeof obj[key] === 'function') {
      memo[key] = obj[key].toString();
    } else if (typeof obj[key] === 'object') {
      memo[key] = objToJson(obj[key]);
    } else {
      memo[key] = obj[key];
    }

    return memo;
  }, {});
}

// Get the id from filename. Respect parent directory name
// if and only if it is _design or _local.
function idFromFilename(filename, ext) {
  var basename = path.basename(filename, ext);
  var root = path.basename(path.dirname(filename));

  if (RESERVED_DOCID_PREFIXES.indexOf(root) === -1) {
    return basename;
  }

  return path.join(root, basename);
}

// Compile a Couchapp module.
function compileModule(filename, options, callback) {
  var doc;
  var err;

  try {
    doc = objToJson(require(filename));
  } catch (e) {
    err = e;
  }

  if (err) {
    return callback(err);
  }
  
  if (!doc._id) {
    doc._id = idFromFilename(filename, '.js');
  }

  callback(null, doc);
}

// Read and parse JSON documents.
function compileJSON(filename, options, callback) {
  fs.readFile(filename, function(err, doc) {
    if (err) {
      return callback(err);
    }

    try {
      doc = JSON.parse(doc);
    } catch (e) {
      err = e;
    }

    if (err) {
      return callback(err);
    }

    if (!doc._id) {
      doc._id = idFromFilename(filename, '.json');
    }

    callback(null, doc);
  });
}

// Compile a directory.
function compileDirectory(dir, options, callback) {
  var doc = {};
  var attachments = [];
  
  function readFile(filename, done) {
    fs.stat(filename, function(err, stats) {
      if (err) {
        return callback(err);
      }

      // only handle files
      if (!stats.isFile()) {
        return done(null);
      }

      var relpath = filename.substr(dir.length).replace(/^\//, '');
      var parts = relpath.split('/');
      var isAttachment = parts[0] === '_attachments';
      var readOpts = {
        encoding: isAttachment ? null : 'utf8'
      };

      fs.readFile(filename, readOpts, function(err, data) {
        if (err) {
          return done(err);
        }

        if (parts[0] === '_attachments') {
          parts.shift();
          var name = parts.join('/');
          var contentType = mime.lookup(filename);

          if (options.multipart) {
            attachments.push({
              name: name,
              data: data,
              content_type: contentType
            });
          } else {
            doc._attachments = doc._attachments || {};
            doc._attachments[name] = {
              data: data.toString('base64'),
              content_type: contentType
            };
          }
        } else {
          var key = parts.pop().replace(/\.[^\.]*$/, '');
          var part = parts.reduce(function(result, key) {
            result[key] = result[key] || {};
            return result[key];
          }, doc);

          var err;
          if (filename.match(/\.json$/)) {
            try {
              part[key] = JSON.parse(data);
            } catch(e) {
              err = e;
            }
          } else {
            part[key] = data.toString().trim();
          }
        }

        if (err) {
          return done(err);
        }

        done(null);
      });
    });
  }

  glob(path.join(dir, '**/*'), function(err, filenames) {
    if (err) {
      return callback(err);
    }

    async.each(filenames, readFile, function(err) {
      if (err) {
        return callback(err);
      }

      if (!doc._id) {
        doc._id = idFromFilename(dir);
      }

      if (options.multipart) {
        callback(null, doc, attachments);
      } else {
        callback(null, doc);
      }
    });
  });
};

// Compile `source`, which can be
// * JSON file
// * JavaScript module
// * Couchapp directory
module.exports = function compile(source, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // resolve absolute path
  source = path.resolve(process.cwd(), source);

  fs.stat(source, function(err, stats) {
    if (err) {
      return callback(err);
    }

    if (stats.isDirectory()) {
      return compileDirectory(source, options, callback);
    }
    
    if (!stats.isFile()) {
      return callback({ error: 'not a file: ' + source });
    }

    var ext = path.extname(source);

    switch (path.extname(source)) {
      case '.js':
        compileModule(source, options, callback);
        break;

      case '.json':
        compileJSON(source, options, callback);
        break;

      default:
        callback({ error: 'unsupported extension: ' + source });
    }
  });
};
