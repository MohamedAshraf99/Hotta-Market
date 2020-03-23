const express = require('express');
const app = express();
const path = require('path');
const http = require("http").Server(app)
const io = require("socket.io")(http)
var CronJob = require('cron').CronJob;
const { updateConnectionId } = require('./routes/users')
const listEndpoints = require("express-list-endpoints")
const _ = require("lodash")
const {seedAuths} = require("./RBAC_Auth/models/auth")

require('./startup/logging')();
require('./startup/routes')(app, io);
require('./startup/db')();
require('./startup/config')();
require('./startup/prod')(app);

// app.use('/api',express.static(__dirname + '/apidoc'));

const port = process.env.PORT || 5000;

http.listen(port, () => console.log(`Listening on port ${port}...`));


//==============assign routes to auth===============
let routes = _.uniq(listEndpoints(app).map(p=>p.path.split('/')[2]));
seedAuths(routes)
//==============================


io.on("connection", async (socket) => {
  console.log('A client just joined on NoooooooooooooooooooooooooooooW', socket.id);
  console.log(socket.handshake.query['_id']);

  await updateConnectionId(socket.handshake.query['_id'], socket.id)

  socket.on('disconnect', async () => {

    console.log('Disconnnnnnnnnnectiong')
    await updateConnectionId(socket.handshake.query['_id'], null)

  })
  
})


//cron update every 
// const schedul = new CronJob('*/30 * * * * *', function() {
//   console.log('allah')
// });
// schedul.start();