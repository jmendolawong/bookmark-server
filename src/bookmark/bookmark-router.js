const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const bookmarks = require('../store')
const BookmarksService = require('./bookmarks-service')
const xss = require('xss')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

//sanitize any API response
const sanitizeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  rating: bookmark.rating,
  description: xss(bookmark.description)

})

/*
This file is the actual API coding.
The route is the pathway and then chained endpoints depending on the client
The knexInstance comes from the server app.set('db', db)
BookmarksService is where the database knex queries live
Sanitizing comes from preventing malicious embedded API responses
*/
bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(sanitizeBookmark))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res) => {
    const { title, url, rating, description = "" } = req.body;
    const bookmark = { id, title, url, rating, description };
    const expectedRating = ['1', '2', '3', '4', '5']

    for (const [key, value] of Object.entries(bookmark)) {
      if (key !== 'description' && value == null) {
        logger.error(`${key} is required`)
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        })
      }
    }
    if (!expectedRating.includes(rating)) {
      logger.error('Invalid rating')
      return res.status(400).send('Invalid data')
    }

    BookmarksService.insertBookmark(req.app.get('db'), bookmark)
      .then(bookmark => {
        res.status(201)
          .location(`http://localhost:8000/bookmarks/${id}`)
          .json(sanitizeBookmark(bookmark));
      })
  })

bookmarkRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    BookmarksService.getBookmarkById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(sanitizeBookmark(bookmark))
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(req.app.get('db'), req.params.id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = bookmarkRouter