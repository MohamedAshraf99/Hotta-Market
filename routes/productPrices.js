const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ProductPrice, updateProductPrice } = require('../models/productPrice');
const express = require('express');
const router = express.Router();

router.put('/edit/:id', async (req, res) => {
    let updated = await updateProductPrice(req);

    if(updated.message && updated.path && updated.type && updated.context)
        return res.status(400).send(updated.message)

    res.send(updated);
});

module.exports = router; 
