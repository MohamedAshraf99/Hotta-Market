const {authnMW, authrMW,} = require('../RBAC_Auth/models/auth');
const { Product, addProduct,getProductDetails } = require('../models/product');
const { upload } = require('../services/helper')
const express = require('express');
const router = express.Router();



router.post('/add',
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'avatars' }])
    , async (req, res) => {

        return console.log(req.body.avatars);
        
        req.body = JSON.parse(req.body.data || {});

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
