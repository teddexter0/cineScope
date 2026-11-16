const { readFile } = require('node:fs/promises')
const assert = require('node:assert/strict')
const { firestore, decodeFields } = require('../lib/firestore-rest.cjs')
const { prepareDocuments } = require('./import-firestore.cjs')

// Read-only verification before CineScope starts writing to the destination.
async function verify(path) {
  const { documents } = JSON.parse(await readFile(path, 'utf8'))
  const prepared = prepareDocuments(documents)
  const expected = new Map(prepared.map((doc) => [doc.name, decodeFields(doc.fields)]))
  const collections = [...new Set(documents.map((doc) => doc.collection))]
  const counts = {}
  const records = new Map()
  for (const collection of collections) {
    const responses = await firestore(':runQuery', { structuredQuery: { from: [{ collectionId: collection }] } })
    const found = responses.filter((item) => item.document).map((item) => item.document)
    counts[collection] = found.length
    assert.equal(found.length, documents.filter((doc) => doc.collection === collection).length, `Count mismatch: ${collection}`)
    for (const doc of found) {
      assert.ok(expected.has(doc.name), `Unexpected document in ${collection}`)
      const row = decodeFields(doc.fields)
      assert.deepEqual(row, expected.get(doc.name), `Field mismatch in ${collection}`)
      records.set(`${collection}/${row.id}`, row)
      if (collection === 'users') assert.ok(!Object.hasOwn(row, 'password'), 'A profile contains a password')
    }
  }
  let references = 0
  const links = { userId: 'users', movieId: 'movies', watchlistId: 'watchlists', followerId: 'users', followingId: 'users' }
  for (const row of records.values()) for (const [field, collection] of Object.entries(links)) {
    if (row[field] == null) continue
    assert.ok(records.has(`${collection}/${row[field]}`), `Orphaned ${field} reference`)
    references++
  }
  return { project: process.env.FIREBASE_PROJECT_ID, documents: records.size, counts, references, fieldsMatch: true }
}

module.exports = { verify }
if (require.main === module) verify(process.argv[2]).then((result) => console.log(JSON.stringify(result))).catch((error) => {
  // Assertion details can contain private profile fields; print the summary only.
  console.error(error.message.split('\n')[0])
  process.exitCode = 1
})
