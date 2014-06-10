#!/usr/bin/env node

var compile = require('./');

compile(process.argv[2] || process.cwd(), function(err, doc) {
  console.log(JSON.stringify(doc, '', '  '));
});
