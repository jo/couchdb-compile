#!/usr/bin/env node
var minimist = require('minimist')
var compile = require('./')

var options = minimist(process.argv.slice(2), {
  boolean: ['index', 'multipart']
})

var source = options._[0] || process.cwd()

compile(source, options, function(error, response) {
  if (error) return console.error(error)

  console.log(JSON.stringify(response, null, '  '))
})
