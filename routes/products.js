const {authnMW, authrMW, testableAuthnMW} = require('../RBAC_Auth/models/auth');
const { Product, addProduct,getProductDetails } = require('../models/product');
const { upload } = require('../services/helper')
const express = require('express');
const router = express.Router();


router.post('/add', testableAuthnMW, upload.array('avatars'), async (req, res) => {

    req.body = JSON.parse(req.body.data || {});
    req.body.vendor = req.user._id

    let productPrices = req.body.productPrices || [];



    productPrices = productPrices.map(pp => {

        let avatarsLength = !isNaN(pp.avatars) ? parseInt(pp.avatars) : 0,
            avatars = []

        for (let i = 0; (i < avatarsLength && req.files.length); i++) {

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
router.get('/getProductDetails/:id', async (req, res) => {

    let ProductDetails = await getProductDetails(req);

    if (ProductDetails.message && ProductDetails.path && ProductDetails.type && ProductDetails.context)
        return res.status(400).send(ProductDetails.message)

    res.send(ProductDetails);
});


module.exports = router; 
