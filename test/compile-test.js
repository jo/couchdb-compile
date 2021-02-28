const test = require('tap').test
const compile = require('..')
const path = require('path')
const async = require('async')
const glob = require('glob')
const EXPECTED_DIR = path.join(__dirname, 'expected')
const FIXTURES_DIR = path.join(__dirname, 'fixtures')

function testFile (file) {
  const relative = path.relative(FIXTURES_DIR, file)

  test(relative, function (t) {
    compile(file, { index: true }, function (error, doc) {
      const expected = require(path.join(EXPECTED_DIR, relative))

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
  const fixturesPath = path.join(FIXTURES_DIR, 'array-example.js')

  compile(fixturesPath, { index: true }, function (error, doc) {
    t.error(error)
    t.ok(Array.isArray(doc.array), 'parses Array correctly')
    t.end()
  })
})

test('compile called with object', function (t) {
  const module = {
    foo: 'bar'
  }

  compile(module, function (error, doc) {
    t.error(error)
    t.same(doc, module, 'passes module')
    t.end()
  })
})

test('compile called with object containing function', function (t) {
  const module = {
    foo: function () {}
  }

  compile(module, function (error, doc) {
    t.error(error)
    t.same(doc, {
      foo: module.foo.toString()
    }, 'stringifies function')
    t.end()
  })
})
