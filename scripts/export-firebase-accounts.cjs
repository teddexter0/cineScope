const { writeFile } = require('node:fs/promises')
const { Prisma, PrismaClient } = require('@prisma/client')

function buildAuthImport(rows) {
  const emails = new Set()
  const users = []
  let disabled = 0
  let withoutPassword = 0

  for (const [index, row] of rows.entries()) {
    const email = row.email.trim().toLowerCase()
    const label = `Source account row ${index + 1}`
    if (!/^[^\s@]+@[^\s@]+$/.test(email) || !row.id || row.id.length > 128) {
      throw new Error(`${label} has an invalid email or UID.`)
    }
    if (emails.has(email)) throw new Error(`${label} duplicates a normalized email.`)
    emails.add(email)

    if (row.password && !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(row.password)) {
      throw new Error(`${label} does not have a supported bcrypt hash.`)
    }

    const account = {
      localId: row.id,
      email,
      emailVerified: Boolean(row.emailVerified),
      disabled: !row.isActive || email === 'test@cinescope.com',
      createdAt: String(row.createdAt.getTime()),
    }
    if (row.lastLoginAt) account.lastSignedInAt = String(row.lastLoginAt.getTime())
    if (row.name) account.displayName = row.name
    if (row.password) account.passwordHash = Buffer.from(row.password, 'utf8').toString('base64')

    if (account.disabled) disabled++
    if (!row.password) withoutPassword++
    users.push(account)
  }

  return { users, disabled, withoutPassword }
}

async function readSnapshot(prisma) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`
    const tables = await tx.$queryRaw`
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
    `
    const present = new Set(tables.map(({ name }) => name))
    if (!present.has('users')) throw new Error('The source database does not have a users table.')

    const counts = {}
    const missingTables = []
    for (const model of Prisma.dmmf.datamodel.models) {
      const table = model.dbName ?? model.name
      if (!present.has(table)) {
        missingTables.push(table)
        continue
      }
      const identifier = Prisma.raw(`"${table.replaceAll('"', '""')}"`)
      const [result] = await tx.$queryRaw`SELECT count(*)::text AS count FROM ${identifier}`
      counts[table] = result.count
    }
    if (counts.accounts && counts.accounts !== '0') {
      throw new Error('The source has linked provider accounts. Map and verify their identities before importing.')
    }

    const rows = await tx.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true, email: true, name: true, password: true, isActive: true,
        createdAt: true, lastLoginAt: true, emailVerified: true,
      },
    })
    return { counts, missingTables, ...buildAuthImport(rows) }
  }, { isolationLevel: 'RepeatableRead', timeout: 60_000 })
}

async function main() {
  const [output, ...extra] = process.argv.slice(2)
  if (extra.length || (output && !output.endsWith('.cinescope-auth.json'))) {
    throw new Error('Usage: node scripts/export-firebase-accounts.cjs [path.cinescope-auth.json]')
  }
  const prisma = new PrismaClient({ log: [] })
  try {
    const { users, disabled, withoutPassword, counts, missingTables } = await readSnapshot(prisma)
    if (output) {
      if (!users.length) throw new Error('The source has zero users. Check that you selected the recovered database.')
      await writeFile(output, JSON.stringify({ users }), { flag: 'wx', mode: 0o600 })
    }
    console.log(JSON.stringify({
      accounts: users.length, disabled, withoutPassword, counts, missingTables, authFileWritten: Boolean(output),
    }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

module.exports = { buildAuthImport, readSnapshot }

if (require.main === module) {
  main().catch((error) => {
    // Prisma messages may include connection details. Print its error code only.
    console.error(error.name?.startsWith('PrismaClient')
      ? `Source database check failed (${error.errorCode ?? error.code ?? error.name}).`
      : error.message)
    process.exitCode = 1
  })
}
