// couch-compile
// (c) 2014 Johannes J. Schmidt

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var mime = require('mime');
var async = require('async');

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

// Compile a Couchapp module.
function compileModule(filename, callback) {
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
  
  callback(null, doc);
}

// Read and parse JSON documents.
function compileJSON(filename, callback) {
  fs.readFile(filename, function(err, data) {
    if (err) {
      return callback(err);
    }

    callback(null, JSON.parse(data));
  });
}

// Compile a directory.
function compileDirectory(dir, options, callback) {
  var doc = {};
  
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

        var err;
        var key;

        if (parts[0] === '_attachments') {
          parts.shift();
          key = parts.join('/');
          doc._attachments = doc._attachments || {};
          doc._attachments[key] = {
            data: data.toString('base64'),
            content_type: mime.lookup(filename)
          };
        } else {
          key = parts.pop().replace(/\.[^\.]*$/, '');
          var part = parts.reduce(function(result, key) {
            result[key] = result[key] || {};
            return result[key];
          }, doc);

          if (filename.match(/\.json$/)) {
            try {
              part[key] = JSON.parse(data);
            } catch(e) {
              err = e;
            }
          } else {
            part[key] = data.trim();
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

      callback(null, doc);
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
        compileModule(source, callback);
        break;

      case '.json':
        compileJSON(source, callback);
        break;

      default:
        callback({ error: 'unsupported extension: ' + source });
    }
  });
};
