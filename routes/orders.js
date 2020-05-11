const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Order,addOrder } = require('../models/order');
const express = require('express');
const router = express.Router();


router.post('/add', async (req, res) => {

    let newOrder = await addOrder(req);

    if (newOrder.message && newOrder.path && newOrder.type && newOrder.context)
        return res.status(400).send(newOrder.message)

    res.send(newOrder);
});

module.exports = router; 
