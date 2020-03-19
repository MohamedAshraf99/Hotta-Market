 const path = require('path');


module.exports = function(err, req, res, next){

 

  if (!err.statusCode) err.statusCode = 500;

  if (err.shouldRedirect) {

 
    res.sendFile(path.join(__dirname,'404.html'));
  } else {
    res.status(err.statusCode).send(err.message); 
  }
 
 }