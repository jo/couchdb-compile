const test = require('tap').test
const compile = require('..')
const fs = require('fs')
const path = require('path')

test('multipart', function (t) {
  const file = path.join(__dirname, 'fixtures', 'attachment')

  compile(file, { multipart: true }, function (error, doc, attachments) {
    t.error(error)
    t.deepEqual(doc, { _id: '_design/attachment' }, 'should have proper id but no attachment stubs')

    t.ok(Array.isArray(attachments), 'attachments argument is an array')
    t.equal(attachments.length, 1, 'one attachment present')

    const attachment = attachments[0]
    t.equal(attachment.name, 'attachment', 'correct name set')
    t.equal(attachment.content_type, 'application/octet-stream', 'correct content_type set')
    t.ok(Buffer.isBuffer(attachment.data), 'data is a buffer')

    const attachmentfile = path.join(file, '_attachments', 'attachment')
    t.equal(attachment.data.toString(), fs.readFileSync(attachmentfile).toString(), 'correct data set')

    t.end()
  })
})
