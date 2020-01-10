const BookmarksService = {

  //GET ------------------
  getAllBookmarks(knex) {
    return knex
      .select('*')
      .from('bookmarks')
  },

  getBookmarkById(knex, id) {
    return knex
      .from('bookmarks')
      .select('*')
      .where('id', id)
      .first()
  },

  //POST ------------------
  insertBookmark(knex, newBookmark) {
    return knex
      .insert(newBookmark)
      .into('bookmarks')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  //DELETE ------------------
  deleteBookmark(knex, id) {
    return knex('bookmarks')
      .where({ id })
      .delete()
  },

  //UPDATE ------------------
  updateBookmark(knex, id, updateData) {
    return knex('bookmarks')
      .update(updateData)
      .where({ id })
  }

}

module.exports = BookmarksService