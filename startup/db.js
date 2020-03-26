 const mongoose = require('mongoose');


module.exports = function () {
  mongoose.connect('mongodb://admin2:mrMgr2020@localhost:27017/mrMgr', {useCreateIndex: true,
  useNewUrlParser: true})
    .then(() => console.log("Connetion To MongoDB ......."))
    .catch((err) => console.error('error When Connecting to MongoDB...',err))
}