const { readFile } = require('node:fs/promises')
const { firestore, firestoreRoot, decodeFields } = require('../lib/firestore-rest.cjs')

function comparable(value) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(comparable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, comparable(value[key])]))
  }
  return value
}

function prepareDocuments(documents) {
  const root = firestoreRoot()
  const names = new Set()
  return documents.map(({ collection, id, fields }) => {
    if (!/^\w+$/.test(collection) || !id || id.includes('/') || id === '.' || id === '..' || /^__.*__$/.test(id)) {
      throw new Error('Invalid document path in the staged file.')
    }
    const name = `${root}/${collection}/${id}`
    if (names.has(name)) throw new Error('Duplicate document path in the staged file.')
    names.add(name)
    if (collection === 'users') {
      if (Object.hasOwn(fields, 'password')) throw new Error('The staged profile file contains a password field.')
      fields = { ...fields }
      for (const key of ['email', 'name', 'username']) {
        const value = fields[key]?.stringValue
        fields[`${key}Lower`] = typeof value === 'string' ? { stringValue: value.toLowerCase() } : { nullValue: null }
      }
    }
    return { name, fields }
  })
}

async function missingDocuments(documents) {
  const result = await firestore(':batchGet', { documents: documents.map(({ name }) => name) })
  const byName = new Map(result.filter((item) => item.found || item.missing).map((item) => [item.found?.name || item.missing, item]))
  return documents.filter((doc) => {
    const item = byName.get(doc.name)
    if (!item) throw new Error('Firestore did not report every requested document.')
    if (item.missing) return true
    const existing = JSON.stringify(comparable(decodeFields(item.found.fields)))
    const expected = JSON.stringify(comparable(decodeFields(doc.fields)))
    if (existing !== expected) throw new Error('Destination contains changed records. Import stopped without overwriting them.')
    return false
  })
}

async function main() {
  const [path, mode, ...extra] = process.argv.slice(2)
  if (!path || extra.length || (mode && mode !== '--apply')) {
    throw new Error('Usage: node scripts/import-firestore.cjs <private-file.cinescope-firestore.json> [--apply]')
  }
  const staged = JSON.parse(await readFile(path, 'utf8'))
  const documents = prepareDocuments(staged.documents)
  if (!documents.length) throw new Error('No staged documents.')
  const missing = []
  for (let offset = 0; offset < documents.length; offset += 100) {
    missing.push(...await missingDocuments(documents.slice(offset, offset + 100)))
  }
  if (mode === '--apply') {
    for (let offset = 0; offset < missing.length; offset += 100) {
      const batch = missing.slice(offset, offset + 100)
      await firestore(':commit', { writes: batch.map((doc) => ({ update: doc, currentDocument: { exists: false } })) })
      if ((await missingDocuments(batch)).length) throw new Error('A committed document could not be verified.')
    }
  }
  console.log(JSON.stringify({ project: process.env.FIREBASE_PROJECT_ID, staged: documents.length, existing: documents.length - missing.length,
    pending: mode ? 0 : missing.length, imported: mode ? missing.length : 0 }))
}

module.exports = { prepareDocuments }

if (require.main === module) main().catch((error) => {
  console.error(error instanceof SyntaxError ? 'Invalid Firestore staging JSON.' : error.message)
  process.exitCode = 1
})
