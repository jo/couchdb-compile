#!/usr/bin/env node
var minimist = require('minimist')
var stringify = require('json-stable-stringify')
var compile = require('./')

var options = minimist(process.argv.slice(2), {
  boolean: ['index', 'pretty']
})

var stringifyOptions = {}

if (options.pretty) {
  stringifyOptions.space = 2
}

options.multipart = false

var source = options._[0] || process.cwd()

compile(source, options, function (error, response) {
  if (error) return console.error(error)

  console.log(stringify(response, stringifyOptions))
})
