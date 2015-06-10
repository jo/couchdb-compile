#!/usr/bin/env node

var compile = require('./')

var args = process.argv.slice(2)
var source = args[2] || process.cwd()

compile(source, function(error, response) {
  if (error) return console.error(error)

  console.log(JSON.stringify(response, null, '  '))
})
