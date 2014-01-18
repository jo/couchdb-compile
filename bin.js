#!/usr/bin/env node

var compile = require('./');

var source = process.argv[2];
if (!source) {
  console.log('Give me a file or directory!');
  return;
}

compile(process.argv[2], function(err, doc) {
  console.log(JSON.stringify(doc, '', '  '));
});
