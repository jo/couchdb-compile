// couch-compile
// (c) 2014 Johannes J. Schmidt

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var mime = require('mime');
var async = require('async');

// kudos: http://stackoverflow.com/a/646643
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}
// kudos: https://github.com/mikeal/node.couchapp.js/blob/fa4e0858630706ca720ec860eb07faf1a8aece97/main.js
// utility function to detect filtered files
var filterByIgnore = function(f, ignoreFilesArr){
  var match=false;
  ignoreFilesArr.forEach(
    function(exp,i,arr){
      var trimmedEx = exp.trim()
      if (trimmedEx.startsWith('[') || trimmedEx.startsWith(']')) {
      } else if (trimmedEx.startsWith('//')) {
      } else if (trimmedEx == '') {
      } else {
        var regexed = trimmedEx.replace(/^"(.+(?="$))"$/, '$1');
        if(new RegExp(regexed).test(f))
        {
          match=true;
          console.log("Ignoring file: " + JSON.stringify(f) + " matching ignore rule: '" + trimmedEx + "'");
        } else {
          //console.log("File passes: " + JSON.stringify(f) + " ignore rule: '" + trimmedEx + "'");
        }
      }
    });
  return match;
}

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
  
  callback(null, doc);
}

// Read and parse JSON documents.
function compileJSON(filename, options, callback) {
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

      var ignoreFiles = options.ignoreFiles;
      if (ignoreFiles != null) {
        var isIgnored = filterByIgnore(filename, ignoreFiles);
        if (isIgnored) {
          console.log("isIgnored: " + JSON.stringify(filename));
          return done(null);
        }
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
