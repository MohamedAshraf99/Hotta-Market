const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ShipCard,addCart,deleteCart,toggleCart } = require('../models/shipCard');
const express = require('express');
const router = express.Router();

router.post('/add', async (req, res) => {

        let newCart = await addCart(req);

        if (newCart.message && newCart.path && newCart.type && newCart.context)
            return res.status(400).send(newCart.message)

        res.send(newCart);
    });

    router.post('/toggle/:product', async (req, res) => {

        req.body = {
            ...req.body,
            client: req.query.userId,
            productPrice: req.params.product
        }
        
        let toggle = await toggleCart(req);
    
        if (toggle.message && toggle.path && toggle.type && toggle.context)
            return res.status(400).send(toggle.message)
    
        res.send(toggle);
    });
    

    router.post('/delete', async (req, res) => {

        let dltCart = await deleteCart(req);

        if (dltCart.message && dltCart.path && dltCart.type && dltCart.context)
            return res.status(400).send(dltCart.message)

        res.send(dltCart);
    });


module.exports = router; 
