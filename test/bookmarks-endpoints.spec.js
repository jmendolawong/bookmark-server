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


  //GET Endpoints -------------------------
  describe('GET /api/bookmarks', () => {
    context(`Given there's no data in the database`, () => {
      it('responds with 200 and with an empty array', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks)
      })

    })
  })

  describe('GET /api/bookmarks/:id', () => {

    context(`Given there's no data in the database`, () => {
      it('responds with 404 and an empty array', () => {
        const bookmarkId = 1234
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
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
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark)
      })
    })
  })

  //POST Endpoints -------------------------
  //
  describe(`POST /api/bookmarks`, () => {
    it(`returns 201 and inserts new bookmark`, () => {
      const newBookmark = {
        title: 'new title',
        url: 'new url',
        rating: '5',
        description: 'new description'
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })

    const requiredFields = ['title', 'url', 'rating']

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'new title',
        url: 'new url',
        rating: '5'
      }

      it(`responds with 400 and an error message when the ${field} is missing`, () => {
        delete newBookmark[field]
        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in the request body` }
          })
      })

    })

  })

  //DELETE Endpoints
  describe('DELETE /api/bookmarks/:bookmark_id', () => {
    context('Given no bookmarks', () => {
      it(`returns 404 with error message`, () => {
        const bookmarkId = 1234
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context(`Given bookmark data`, () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('seed the database', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it(`returns with 204 and the rest of the bookmarks`, () => {
        const bookmarkId = 2
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== bookmarkId)
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/bookmarks`)
              .expect(expectedBookmarks)
          })
      })
    })
  })

  //PATCH Endpoints
  describe(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`given no bookmark data`, () => {
      it(`responds with a 404 and an error message`, () => {
        const bookmarkId = 1234
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })

    context(`given bookmark data`, () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('seed table', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it(`responds with a 204 and updates accordingly, no data return`, () => {
        const bookmarkId = 2
        const updateBookmark = {
          title: 'updated title',
          url: 'updated url',
          rating: '3',
          description: 'updated description'
        }
        const expectedBookmark = {
          ...testBookmarks[bookmarkId],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${bookmarkId}`)
              .expect(expectedBookmark)
          )
      })

      it(`returns 400 because missing fields`, () => {
        const bookmarkId = 2
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ nullField: 'foo' })
          .expect(400, { error: { message: `Request body must contain either 'title', 'url' or 'rating'` } })
      })

      it(`responds with a 204 when updating only a subset of the fields`, () => {
        const bookmarkId = 2
        const updateBookmark = {
          title: 'updated title',
        }
        const expectedBookmark = {
          ...testBookmarks[bookmarkId],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${bookmarkId}`)
              .expect(expectedBookmark)
          )
      })


    })
  })

})