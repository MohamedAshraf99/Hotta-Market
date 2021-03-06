const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('لا يمكنك الوصول. الرقم السرى غير موجود.');
   try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded; 
     next();
  }
  catch (ex) {
    
    res.status(400).send('رقم سري غير صحيح.');
  }
}