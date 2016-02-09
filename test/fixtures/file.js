module.exports = {
  _id: '_design/jsfile',
  views: {
    names: {
      map: function (doc) {
        if (doc.name) {
          emit(doc.name, null)
        }
      }
    }
  }
}
