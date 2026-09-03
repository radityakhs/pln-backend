import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

async function checkDb() {
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'pln_profile',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
  }

  console.log('Connecting to MySQL with config:')
  console.log(`  Host: ${config.host}`)
  console.log(`  User: ${config.user}`)
  console.log(`  Database: ${config.database}`)
  console.log(`  Port: ${config.port}`)
  console.log('')

  try {
    const connection = await mysql.createConnection(config)
    console.log('✅ Connected to MySQL successfully!')

    // Check if database exists
    const [dbs] = await connection.query('SHOW DATABASES')
    const dbExists = dbs.some((db) => db.Database === config.database)
    console.log(dbExists ? `✅ Database "${config.database}" exists` : `❌ Database "${config.database}" does not exist`)

    if (dbExists) {
      // Check tables
      const [tables] = await connection.query('SHOW TABLES')
      const tableNames = tables.map((t) => Object.values(t)[0])
      console.log(`\nTables in "${config.database}":`)

      const expectedTables = ['events', 'gallery', 'pillars']
      for (const table of expectedTables) {
        if (tableNames.includes(table)) {
          const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``)
          console.log(`  ✅ ${table} - ${rows[0].count} records`)
        } else {
          console.log(`  ❌ ${table} - not found`)
        }
      }
    }

    await connection.end()
    console.log('\n✅ Database check complete!')
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
    process.exit(1)
  }
}

checkDb()
