var test = require('tap').test
var compile = require('..')
var path = require('path')
var async = require('async')
var glob = require('glob')
var EXPECTED_DIR = path.join(__dirname, 'expected')
var FIXTURES_DIR = path.join(__dirname, 'fixtures')

function testFile (file) {
  var relative = path.relative(FIXTURES_DIR, file)

  test(relative, function (t) {
    compile(file, { index: true }, function (error, doc) {
      var expected = require(path.join(EXPECTED_DIR, relative))

      // console.log(JSON.stringify(doc, '', '  '))

      t.error(error)
      t.deepEqual(doc, expected, 'should have compiled correct result')
      t.end()
    })
  })
}

glob(path.join(FIXTURES_DIR, '{_design/*,_local/*,[^_]*}'), function (error, files) {
  if (error) {
    return console.error(error)
  }

  async.each(files, testFile, function (error) {
    if (error) {
      console.error(error)
    }
  })
})

test('array value from common-js', function (t) {
  var fixturesPath = path.join(FIXTURES_DIR, 'array-example.js')

  compile(fixturesPath, { index: true }, function (error, doc) {
    t.error(error)
    t.ok(Array.isArray(doc.array), 'parses Array correctly')
    t.end()
  })
})
