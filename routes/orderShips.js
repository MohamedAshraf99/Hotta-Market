const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { orderShip, updateOrderShipForAdmin } = require('../models/orderShip');
const express = require('express');
const router = express.Router();


router.put('/editForAdmin/:id', async (req, res) => {
    let updatedOrderShip = await updateOrderShipForAdmin(req);

    if(updatedOrderShip.message && updatedOrderShip.path && updatedOrderShip.type && updatedOrderShip.context)
        return res.status(400).send(updatedOrderShip.message)

    res.send(updatedOrderShip);
});


module.exports = router; 
