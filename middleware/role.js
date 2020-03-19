// 401 Unauthorized
// 403 Forbidden 


module.exports = function (req, res, next) {
  if (!req.user.isAdmin)
    return res.status(403)
      .send('لا تمتلك صلاحية الدخول !');
  next();
}