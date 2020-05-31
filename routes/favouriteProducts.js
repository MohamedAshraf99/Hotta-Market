const {authnMW, authrMW, testableAuthnMW} = require('../RBAC_Auth/models/auth');
const { FavouriteProduct, addFavouriteProduct, getFavouriteProducts, toggleFavouriteProduct } = require('../models/favouriteProduct');
const express = require('express');
const router = express.Router();




router.get('/:id', async (req, res) => {
    let favouriteProducts = await getFavouriteProducts(req);
    res.send(favouriteProducts);
});


router.post('/add/:product', async (req, res) => {
    
    req.body = {
        ...req.body,
        user: req.query.userId,
        product: req.params.product
    }
    
    let newFavProd = await addFavouriteProduct(req);

    if (newFavProd.message && newFavProd.path && newFavProd.type && newFavProd.context)
        return res.status(400).send(newFavProd.message)

    res.send(newFavProd);
});


router.post('/toggle/:product', async (req, res) => {

    req.body = {
        ...req.body,
        user: req.query.userId,
        product: req.params.product
    }
    
    let toggleFavProd = await toggleFavouriteProduct(req);

    if (toggleFavProd.message && toggleFavProd.path && toggleFavProd.type && toggleFavProd.context)
        return res.status(400).send(toggleFavProd.message)

    res.send(toggleFavProd);
});

module.exports = router; 
