const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ShipCard,addCart } = require('../models/shipCard');
const express = require('express');
const router = express.Router();

router.post('/add', async (req, res) => {

        let newCart = await addCart(req);

        if (newCart.message && newCart.path && newCart.type && newCart.context)
            return res.status(400).send(newCart.message)

        res.send(newCart);
    });



module.exports = router; 
