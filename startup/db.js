 const mongoose = require('mongoose');


module.exports = function () {
  mongoose.connect('mongodb://localhost:27017/mrMgr'+(false? '?replicaSet=rs': ''), {useCreateIndex: true,
  useNewUrlParser: true})
    .then(() => console.log("Connetion To MongoDB ......."))
    .catch((err) => console.error('error When Connecting to MongoDB...',err))
}