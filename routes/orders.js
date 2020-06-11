const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Order,addOrder,getOrders,getOrderDetails,updateOrder, getAllNumbers,
     getOrdersForAdmin, getOrderDetailsForAdmin, updateOrderForAdmin,getVendorOrders,getVendorOrderDetails } = require('../models/order');
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

router.get('/getVendorOrders/:id', async (req, res) => {

    let orders = await getVendorOrders(req);

    if (orders.message && orders.path && orders.type && orders.context)
        return res.status(400).send(orders.message)

    res.send(orders);
});

router.get('/getOrdersForAdmin', async (req, res) => {

    let orders = await getOrdersForAdmin(req);

    if (orders.message && orders.path && orders.type && orders.context)
        return res.status(400).send(orders.message)

    res.send(orders);
});

router.get('/getOrderDetailsForAdmin/:id', async (req, res) => {

    let order = await getOrderDetailsForAdmin(req);

    if (order.message && order.path && order.type && order.context)
        return res.status(400).send(order.message)

    res.send(order);
});

router.get('/getOrderDetails/:id', async (req, res) => {

    let orderDetails = await getOrderDetails(req);

    if (orderDetails.message && orderDetails.path && orderDetails.type && orderDetails.context)
        return res.status(400).send(orderDetails.message)

    res.send(orderDetails);
});

router.get('/getVendorOrderDetails/:id', async (req, res) => {

    let orderDetails = await getVendorOrderDetails(req);

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


router.put('/editOrderForAdmin/:id', async (req, res) => {
    let updatedOrder = await updateOrderForAdmin(req);

    if(updatedOrder.message && updatedOrder.path && updatedOrder.type && updatedOrder.context)
        return res.status(400).send(updatedOrder.message)

    res.send(updatedOrder);
});

router.get('/getAllNumbers', async (req, res) => {
    let all = await getAllNumbers(req);
    res.send(all);
});


module.exports = router; 
