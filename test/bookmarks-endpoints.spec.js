const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks endpoints', () => {

  let db

  before('Create knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
  app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('clean up tables', () => db('bookmarks').truncate())

  describe('GET /bookmarks', () => {
    context(`Given there's no data in the database`, () => {
      it('responds with 200 and with an empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization',`Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context(`Given there's data in the database`, () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('seed the database', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and returns all bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization',`Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks)
      })

    })
  })

  describe('GET /bookmarks/:id', () => {

    context(`Given there's no data in the database`, () => {
      it('responds with 404 and an empty array', () => {
        const bookmarkId = 1234
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization',`Bearer ${process.env.API_TOKEN}`)
          .expect(404, {error: {message: `Bookmark doesn't exist`}})
      })
    })

    context(`Given there is data`, () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('seed the database', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('Responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId]
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization',`Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark)
      })
    })
  })

})