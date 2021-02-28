#!/usr/bin/env node
const minimist = require('minimist')
const stringify = require('json-stable-stringify')
const compile = require('./')

const options = minimist(process.argv.slice(2), {
  boolean: ['index', 'pretty']
})

const stringifyOptions = {}

if (options.pretty) {
  stringifyOptions.space = 2
}

options.multipart = false

const source = options._[0] || process.cwd()

compile(source, options, function (error, response) {
  if (error) return console.error(error)

  console.log(stringify(response, stringifyOptions))
})
