const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Cat, getCats, addCat } = require('../models/cat');
const express = require('express');
const router = express.Router();
const { upload } = require('../services/helper')


router.get('/', async (req, res) => {
    let cats = await getCats(req);
    res.send(cats);
});


router.post('/add', [upload.single('avatar')], async (req, res) => {
    
    req.body = JSON.parse(req.body.data || {});

    req.body.avatar = (!req.file)? false :`/uploads/${req.file.filename}`;

    let newCat = await addCat(req);

    if (newCat.message && newCat.path && newCat.type && newCat.context)
        return res.status(400).send(newCat.message)

    res.send(newCat);
});

module.exports = router; 
