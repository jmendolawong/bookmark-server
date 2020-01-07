const knex = require('knex')
const app = require('./app')
const { PORT } = require('./config.js')

const db = knex ({
  client: 'pg',
  connection: DB_URL
})

app.set('db', db)

app.listen(PORT, ()=>{
  console.log(`Server listening on http://localhost:${PORT}`)
})