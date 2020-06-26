const {authnMW, authrMW,} = require('../RBAC_Auth/models/auth');
const { Product, addProduct,getProductDetails, updateProduct,
    getProductsForAdmin, getProductForAdmin,updateProducts,advertisementCount} = require('../models/product');
const { upload } = require('../services/helper')
const express = require('express');
const router = express.Router();



router.post('/add',
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'avatars' }])
    , async (req, res) => {

        req.body = JSON.parse(req.body.data || {});

        req.body.avatar = (!req.files.avatar) ? false : `/uploads/${req.files.avatar[0].filename}`;

        let productPrices = req.body.productPrices || [];

        productPrices = productPrices.map(pp => {

            let avatarsLength = !isNaN(pp.avatars) ? parseInt(pp.avatars) : 0,
                avatars = []

            for (let i = 0; (i < avatarsLength && req.files.avatars.length); i++) {
                let filename = (req.files.avatars.shift()).filename,
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

// router.put('/edit/:id', async (req, res) => {
//     let updatedProduct = await updateProducts(req);

//     if(updatedProduct.message && updatedProduct.path && updatedProduct.type && updatedProduct.context)
//         return res.status(400).send(updatedProduct.message)

//     res.send(updatedProduct);
// });

router.put('/edit/:id', upload.single('avatar'), async (req, res) => {

        req.body = JSON.parse(req.body.data || {});
console.log(req.file);

        if (req.file) req.body.avatar = `/uploads/${req.file.filename}`;

        let updatedProduct = await updateProduct(req);

        if (updatedProduct.message && updatedProduct.path && updatedProduct.type && updatedProduct.context)
            return res.status(400).send(updatedProduct.message)

        res.send(updatedProduct);
});


router.put('/advertisementCount/:id', async (req, res) => {
    let count = await advertisementCount(req);

    if(count.message && count.path && count.type && count.context)
        return res.status(400).send(count.message)

    res.send(count);
});

router.get('/getProductDetails/:id', async (req, res) => {

    let ProductDetails = await getProductDetails(req);

    if (ProductDetails.message && ProductDetails.path && ProductDetails.type && ProductDetails.context)
        return res.status(400).send(ProductDetails.message)

    res.send(ProductDetails);
});


router.get('/getProductsForAdmin', async (req, res) => {

    let products = await getProductsForAdmin(req);

    if (products.message && products.path && products.type && products.context)
        return res.status(400).send(products.message)

    res.send(products);
});


router.get('/getProductForAdmin/:id', async (req, res) => {

    let product = await getProductForAdmin(req);

    if (product.message && product.path && product.type && product.context)
        return res.status(400).send(product.message)

    res.send(product);
});

module.exports = router; 
