const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Product, addProduct } = require('../models/product');
const { upload } = require('../services/helper')
const express = require('express');
const router = express.Router();


router.post('/add', upload.array('avatars'), async (req, res) => {

    req.body = JSON.parse(req.body.data || {});

    let productPrices = req.body.productPrices || [];

    productPrices = productPrices.map(pp => {

        let avatarsLength = !isNaN(pp.avatars) ? parseInt(pp.avatars) : 0,
            avatars = []

        while (0 < avatarsLength && req.files.length) {
            let filename = (req.files.shift()).filename,
                avatarPath = `/uploads/${filename}`;
            avatars.push(avatarPath)
        }

        return {
            ...pp,
            avatars
        }
    })

    req.body.productPrices = productPrices;

    let newProduct = await addProduct(req);

    if (newProduct.message && newProduct.path && newProduct.type && newProduct.context)
        return res.status(400).send(newProduct.message)

    res.send(newProduct);
});



module.exports = router; 
