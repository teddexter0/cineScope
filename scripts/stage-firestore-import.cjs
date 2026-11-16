const { readFile, writeFile } = require('node:fs/promises')
const { gunzipSync } = require('node:zlib')
const { Prisma } = require('@prisma/client')
const { stageBackup } = require('./stage-supabase-backup.cjs')

function jsonValue(value, inArray = false) {
  if (value === null) return { nullValue: null }
  if (Array.isArray(value)) {
    if (inArray) throw new Error('A source field contains nested arrays. Map it before import.')
    return { arrayValue: { values: value.map((item) => jsonValue(item, true)) } }
  }
  switch (typeof value) {
    case 'string': return { stringValue: value }
    case 'boolean': return { booleanValue: value }
    case 'number': return Number.isSafeInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
    default: return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item)])) } }
  }
}

function fieldValue(type, value) {
  if (value === null) return { nullValue: null }
  switch (type) {
    case 'BigInt':
    case 'Int': return { integerValue: value }
    case 'Float': return { doubleValue: Number(value) }
    case 'Boolean': return { booleanValue: value === 't' }
    case 'DateTime': return { timestampValue: value.replace(' ', 'T') + 'Z' }
    case 'Json': return jsonValue(JSON.parse(value))
    case 'String': return { stringValue: value }
    default: throw new Error(`Unsupported source type ${type}.`)
  }
}

function stageFirestore(sql) {
  const { tables, counts } = stageBackup(sql)
  const documents = []
  for (const model of Prisma.dmmf.datamodel.models) {
    const collection = model.dbName ?? model.name
    if (['accounts', 'sessions', 'verificationtokens'].includes(collection)) continue
    const fields = model.fields.filter((field) => field.kind === 'scalar' && !(collection === 'users' && field.name === 'password'))
    for (const row of tables.get(collection)?.rows ?? []) {
      const id = row.id
      if (!id || id.includes('/') || id === '.' || id === '..' || /^__.*__$/.test(id) || Buffer.byteLength(id) > 1500) {
        throw new Error(`Invalid document ID in ${collection}.`)
      }
      documents.push({
        collection,
        id,
        fields: Object.fromEntries(fields.map((field) => [field.name, fieldValue(field.type, row[field.dbName ?? field.name])])),
      })
    }
  }
  return { counts, documents }
}

async function main() {
  const [source, output, ...extra] = process.argv.slice(2)
  if (!source || extra.length || (output && !output.endsWith('.cinescope-firestore.json'))) {
    throw new Error('Usage: node scripts/stage-firestore-import.cjs <backup[.gz]> [private-path.cinescope-firestore.json]')
  }
  const bytes = await readFile(source)
  const sql = (bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes).toString('utf8')
  const { counts, documents } = stageFirestore(sql)
  if (output) await writeFile(output, JSON.stringify({ documents }), { flag: 'wx', mode: 0o600 })
  console.log(JSON.stringify({ counts, documents: documents.length, fileWritten: Boolean(output) }, null, 2))
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof SyntaxError ? 'A JSON field in the source backup could not be parsed.' : error.message)
    process.exitCode = 1
  })
}
