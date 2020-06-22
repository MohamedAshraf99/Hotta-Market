const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ProductPrice, updateProductPrice, addProductPrice } = require('../models/productPrice');
const { upload } = require('../services/helper');
const express = require('express');
const router = express.Router();

router.put('/edit/:id', async (req, res) => {
    let updated = await updateProductPrice(req);

    if(updated.message && updated.path && updated.type && updated.context)
        return res.status(400).send(updated.message)

    res.send(updated);
});

router.post('/add', upload.fields([{ name: 'avatars' }]), async (req, res) => {
    req.body = JSON.parse(req.body.data || {});

    let productPrice = req.body || [];

    let avatarsLength = req.files.avatars.length,
        avatars = []

    for (let i = 0; (i < avatarsLength && req.files.avatars.length); i++) {
        let filename = (req.files.avatars.shift()).filename,
            avatarPath = `/uploads/${filename}`;
        avatars.push(avatarPath)
    }

    req.body = { ...productPrice, avatars }

    let newPP = await addProductPrice(req);

    if (newPP.message && newPP.path && newPP.type && newPP.context)
        return res.status(400).send(newPP.message)

    res.send(newPP);
});


module.exports = router; 
