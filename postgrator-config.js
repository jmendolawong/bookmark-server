require('dotenv').config()

module.exports = {
  "migrationsDirectory": "migrations",
  "driver": "pg",
  "connectionString": process.env.TEST_DB_URL,
}