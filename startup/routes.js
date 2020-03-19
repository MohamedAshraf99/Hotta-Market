const express = require('express');
const error = require('../middleware/error');

const roles = require('../RBAC_Auth/routes/roles');
const auth = require('../RBAC_Auth/routes/auth');

const announcementPlans = require('../routes/announcementPlans');
const announcements = require('../routes/announcements');
const areas = require('../routes/areas');
const cats = require('../routes/cats');
const cities = require('../routes/cities');
const cobones = require('../routes/cobones');
const countries = require('../routes/countries');
const creditCards = require('../routes/creditCards');
const generals = require('../routes/generals');
const messages = require('../routes/messages');
const orders = require('../routes/orders');
const paymentTransactions = require('../routes/paymentTransactions');
const pockets = require('../routes/pockets');
const productMainProps = require('../routes/productMainProps');
const productPrices = require('../routes/productPrices');
const productSubProps = require('../routes/productSubProps');
const products = require('../routes/products');
const shipCards = require('../routes/shipCards');
const specialProducts = require('../routes/specialProducts');
const users = require('../routes/users');


const cors = require('cors');


const bodyParser = require('body-parser');


module.exports = function (app, io) {
  app.use(cors());

  app.set("io", io);


  app.set("DefaultAvatar", (req, collectionName) => {

    let host = `${req.protocol}://${req.get('host')}/api`,
      defaultPic = '';

    switch (collectionName) {
      case 'host':
        return host;
        break;
      case 'user':
        defaultPic = '/uploads/6r4kR2po1MWWbje1550582821209.png';
        break;
      default:
        defaultPic = '/uploads/6r4kR2po1MWWbje1550582821209.png';
        break;
    }
    return `${host}${defaultPic}`;
  });

  app.use('/api/uploads', express.static('uploads'))

  // app.use('/admin',express.static('admin'));

  // app.get('/admin/*', function (req, res) {
  //   res.sendFile(path.join(__dirname + '/admin/index.html'));
  // });
  
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({
    limit: '100mb',
    extended: true
  }));


  app.use('/api/roles', roles);
  app.use('/api/auth', auth);
  
  app.use('/api/announcementPlans', announcementPlans);
  app.use('/api/announcements', announcements);
  app.use('/api/areas', areas);
  app.use('/api/cats', cats);
  app.use('/api/cities', cities);
  app.use('/api/cobones', cobones);
  app.use('/api/countries', countries);
  app.use('/api/creditCards', creditCards);
  app.use('/api/generals', generals);
  app.use('/api/messages', messages);
  app.use('/api/orders', orders);
  app.use('/api/paymentTransactions', paymentTransactions);
  app.use('/api/pockets', pockets);
  app.use('/api/productMainProps', productMainProps);
  app.use('/api/productPrices', productPrices);
  app.use('/api/productSubProps', productSubProps);
  app.use('/api/products', products);
  app.use('/api/shipCards', shipCards);
  app.use('/api/specialProducts', specialProducts);
  app.use('/api/users', users);

  app.use(error);
} 
 