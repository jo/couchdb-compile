var test = require('tap').test;
var compile = require('..');
var fs = require('fs');
var path = require('path');
var async = require('async');
var glob = require('glob');
var EXPECTED_DIR = path.join(__dirname, 'expected');
var FIXTURES_DIR = path.join(__dirname, 'fixtures');

function testFile(file) {
  test(file, function(t) {
    compile(file, function(err, doc) {
      var expected = require(path.join(EXPECTED_DIR, path.relative(FIXTURES_DIR, file)));

      // console.log(JSON.stringify(doc, '', '  '));

      if (err) {
        console.log(err);
      }

      t.notOk(err, 'no error should have occured during compile "' + file + '"')
      t.deepEqual(doc, expected, 'should have compiled "' + file + '"');
      t.end();
    });
  });
}

if (process.argv[2]) {
  return testFile(process.argv[2]);
}

glob(path.join(FIXTURES_DIR, '{_design/*,_local/*,[^_].*}'), function(err, files) {
  if (err) {
    return console.log(err);
  }

  async.each(files, testFile, function(err) {
    if (err) {
      console.log(err);
    }
  });
});
