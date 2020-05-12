const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Order,addOrder,getOrders,getOrderDetails,updateOrder } = require('../models/order');
const express = require('express');
const router = express.Router();


router.post('/add', async (req, res) => {

    let newOrder = await addOrder(req);

    if (newOrder.message && newOrder.path && newOrder.type && newOrder.context)
        return res.status(400).send(newOrder.message)

    res.send(newOrder);
});

router.get('/getOrders/:id', async (req, res) => {

    let orders = await getOrders(req);

    if (orders.message && orders.path && orders.type && orders.context)
        return res.status(400).send(orders.message)

    res.send(orders);
});

router.get('/getOrderDetails/:id', async (req, res) => {

    let orderDetails = await getOrderDetails(req);

    if (orderDetails.message && orderDetails.path && orderDetails.type && orderDetails.context)
        return res.status(400).send(orderDetails.message)

    res.send(orderDetails);
});


router.put('/edit/:id', async (req, res) => {
    let updatedOrder = await updateOrder(req);

    if(updatedOrder.message && updatedOrder.path && updatedOrder.type && updatedOrder.context)
        return res.status(400).send(updatedOrder.message)

    res.send(updatedOrder);
});
module.exports = router; 
