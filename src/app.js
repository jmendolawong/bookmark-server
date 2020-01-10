require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config.js')
const bookmarkRouter = require('./bookmark/bookmark-router')
const logger = require('./logger')

const app = express();

const morganSetting = NODE_ENV === 'production' ? 'tiny' : 'dev';
app.use(morgan(morganSetting))
app.use(helmet())
app.use('/api/bookmarks', bookmarkRouter)

app.use(cors())

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`)
    return res.status(401).json({ error: 'Unathorized access' })
  }

  next();
})

app.use((error, req, res, next) => {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error('error');
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app