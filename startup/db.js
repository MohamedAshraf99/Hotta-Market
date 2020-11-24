const mongoose = require("mongoose");

module.exports = function () {
  mongoose;
  // .connect("mongodb://localhost:27017/mrMgr", {
  //   useCreateIndex: true, // access remotly on server db
  mongoose
    .connect(
      "mongodb://localhost:27017/mrMgr",
      {
        useCreateIndex: true, // must on gitlab when push to server
        // mongoose.connect('mongodb://localhost:27017/mrMgr', {useCreateIndex: true,  // local db
        useNewUrlParser: true,
      }
    )
    .then(() => console.log("Connetion To MongoDB ......."))
    .catch((err) => console.error("error When Connecting to MongoDB...", err));
};
