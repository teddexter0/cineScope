const { readFile, writeFile } = require('node:fs/promises')
const { join } = require('node:path')
const { gunzipSync } = require('node:zlib')
const { Prisma } = require('@prisma/client')
const { buildAuthImport } = require('./export-firebase-accounts.cjs')

const models = Prisma.dmmf.datamodel.models
const tableName = (model) => model.dbName ?? model.name
const columnName = (field) => field.dbName ?? field.name
const quote = (name) => `"${name.replaceAll('"', '""')}"`

function decodeCopyValue(value) {
  if (value === '\\N') return null
  const escapes = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v' }
  return value.replace(/\\([bfnrtv\\])/g, (_, character) => escapes[character] ?? character)
}

function readTables(sql) {
  const tables = new Map()
  const blocks = /^COPY (\w+)\.("\w+"|\w+) \(([^\r\n]+)\) FROM stdin;\r?\n([\s\S]*?)^\\\.\r?$/gm
  for (const [, schema, identifier, fields, data] of sql.matchAll(blocks)) {
    if (schema !== 'public') continue
    const name = identifier.replaceAll('"', '')
    if (tables.has(name)) throw new Error(`Multiple COPY blocks for ${name}.`)
    const columns = fields.split(', ').map((column) => column.replaceAll('"', ''))
    const lines = data ? data.replace(/\r?\n$/, '').split(/\r?\n/) : []
    const rows = lines.map((line) => {
      const values = line.split('\t')
      if (values.length !== columns.length) throw new Error(`Unexpected field count in ${name}.`)
      return Object.fromEntries(columns.map((column, index) => [column, decodeCopyValue(values[index])]))
    })
    tables.set(name, { columns, rows, data })
  }
  return tables
}

function stageBackup(sql) {
  const tables = readTables(sql)
  const ordered = new Set()
  const modelsByName = new Map(models.map((model) => [model.name, model]))
  const counts = {}
  for (const model of models) {
    const name = tableName(model)
    const table = tables.get(name)
    if (!table && name === 'episode_reviews') {
      counts[name] = 0
      continue
    }
    const expected = model.fields.filter((field) => field.kind !== 'object').map(columnName)
    if (!table || table.columns.length !== expected.length || !expected.every((column) => table.columns.includes(column))) {
      throw new Error(`Unexpected backup columns for ${name}.`)
    }
    counts[name] = table.rows.length
  }
  for (const name of tables.keys()) {
    if (!(name in counts)) throw new Error(`Unexpected public table ${name}.`)
  }
  if (counts.accounts) throw new Error('The backup has linked provider accounts that need a separate identity mapping.')
  if (!counts.users) throw new Error('The backup has no CineScope users.')

  function addTable(model, visiting = new Set()) {
    if (ordered.has(model)) return
    if (visiting.has(model)) throw new Error('A cycle between tables prevents ordering the import.')
    visiting.add(model)
    for (const relation of model.fields.filter((field) => field.relationFromFields?.length)) {
      const parent = modelsByName.get(relation.type)
      if (parent !== model) addTable(parent, visiting)
      const sourceKeys = relation.relationFromFields.map((name) => columnName(model.fields.find((field) => field.name === name)))
      const parentKeys = relation.relationToFields.map((name) => columnName(parent.fields.find((field) => field.name === name)))
      const parents = new Set((tables.get(tableName(parent))?.rows ?? []).map((row) => JSON.stringify(parentKeys.map((key) => row[key]))))
      for (const row of tables.get(tableName(model))?.rows ?? []) {
        const keys = sourceKeys.map((key) => row[key])
        if (keys.every((key) => key !== null) && !parents.has(JSON.stringify(keys))) {
          throw new Error(`Missing parent row in ${tableName(model)}.${relation.name}.`)
        }
      }
    }
    visiting.delete(model)
    ordered.add(model)
  }
  for (const model of models) addTable(model)

  const accounts = buildAuthImport(tables.get('users').rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    password: row.password,
    isActive: row.isActive === 't',
    emailVerified: row.email_verified,
    createdAt: new Date(`${row.created_at}Z`),
    lastLoginAt: row.last_login_at ? new Date(`${row.last_login_at}Z`) : null,
  })))
  const copies = [...ordered].flatMap((model) => {
    const name = tableName(model)
    const table = tables.get(name)
    if (!table?.rows.length) return []
    return [`COPY public.${quote(name)} (${table.columns.map(quote).join(', ')}) FROM stdin;\n${table.data}\\.\n`]
  })

  return { counts, accounts, data: copies.join('\n'), tables }
}

async function main() {
  const [source, destination, ...extra] = process.argv.slice(2)
  if (!source || extra.length) throw new Error('Usage: node scripts/stage-supabase-backup.cjs <backup[.gz]> [private-output-directory]')
  const bytes = await readFile(source)
  const sql = (bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes).toString('utf8')
  const { counts, accounts, data } = stageBackup(sql)
  if (destination) {
    const options = { flag: 'wx', mode: 0o600 }
    await writeFile(join(destination, 'recovered.cinescope-auth.json'), JSON.stringify({ users: accounts.users }), options)
    await writeFile(join(destination, 'recovered.cinescope-data.sql'), data, options)
  }
  console.log(JSON.stringify({ counts, accounts: accounts.users.length, disabled: accounts.disabled,
    withoutPassword: accounts.withoutPassword, filesWritten: Boolean(destination) }, null, 2))
}

module.exports = { stageBackup }

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
