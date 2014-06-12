var test = require('tap').test;
var compile = require('..');
var fs = require('fs');
var path = require('path');
var async = require('async');

function testFile(file) {
  test(file, function(t) {
    compile(path.join(__dirname, 'fixtures', file), function(err, doc) {
      var expected = require(path.join(__dirname, 'expected', file + '.json'));

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

fs.readdir(path.join(__dirname, 'fixtures'), function(err, files) {
  if (err) {
    return console.log(err);
  }

  async.each(files, testFile, function(err) {
    if (err) {
      console.log(err);
    }
  });
});
