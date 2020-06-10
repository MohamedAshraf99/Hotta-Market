const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { orderShip, updateOrderShipForAdmin,updateOrderShip } = require('../models/orderShip');
const express = require('express');
const router = express.Router();


router.put('/editForAdmin/:id', async (req, res) => {
    let updatedOrderShip = await updateOrderShipForAdmin(req);

    if(updatedOrderShip.message && updatedOrderShip.path && updatedOrderShip.type && updatedOrderShip.context)
        return res.status(400).send(updatedOrderShip.message)

    res.send(updatedOrderShip);
});
router.put('/edit/:id', async (req, res) => {
    let updatedOrder = await updateOrderShip(req);

    if(updatedOrder.message && updatedOrder.path && updatedOrder.type && updatedOrder.context)
        return res.status(400).send(updatedOrder.message)

    res.send(updatedOrder);
});

module.exports = router; 
