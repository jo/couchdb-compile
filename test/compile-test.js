var test = require('tape');
var compile = require('..');
var fs = require('fs');
var path = require('path');
var async = require('async');
var glob = require('glob');
var EXPECTED_DIR = path.join(__dirname, 'expected');
var FIXTURES_DIR = path.join(__dirname, 'fixtures');

function testFile(file) {
  var relative = path.relative(FIXTURES_DIR, file);

  test(relative, function(t) {
    compile(file, { index: true }, function(err, doc) {
      var expected = require(path.join(EXPECTED_DIR, relative));

      // console.log(JSON.stringify(doc, '', '  '));

      if (err) {
        console.log(err);
      }

      t.notOk(err, 'no error should have occured during compile')
      t.deepEqual(doc, expected, 'should have compiled correct result');
      t.end();
    });
  });
}

glob(path.join(FIXTURES_DIR, '{_design/*,_local/*,[^_]*}'), function(err, files) {
  if (err) {
    return console.log(err);
  }

  async.each(files, testFile, function(err) {
    if (err) {
      console.log(err);
    }
  });
});

test('array value from common-js', function (t) {
  var fixturesPath = path.join(FIXTURES_DIR, 'array-example.js')
  console.log(fixturesPath)
  compile(fixturesPath, { index: true }, function (err, doc) {
    t.ok(Array.isArray(doc.array), 'parses Array correctly')
    t.end();
  })
})
