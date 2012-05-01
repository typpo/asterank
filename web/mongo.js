var mongo = require('mongodb');

// Collection handle to our mongo db
// cb(err, collection_handle)
function getCollection(collName, cb) {
  // send to mongo
  mongo.connect(process.env.MONGOHQ_URL || 'mongodb://localhost:27017/asterank', function(err, conn) {
    if (err) {
      cb(true, null);
      return;
    }
    conn.collection(collName, function(err, collection) {
      if (err) {
        cb(true, null);
        return;
      }
      cb(false, collection);
    }); // end mongo collection
  }); // end mongo connection
}


module.exports = {
  getCollection: getCollection,

}
