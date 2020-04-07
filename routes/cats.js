const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Cat, getCats, addCat } = require('../models/cat');
const express = require('express');
const router = express.Router();
const { upload } = require('../services/helper')



router.get('/', async (req, res) => {
    let cats = await getCats(req);
    res.send(cats);
});



router.post('/add',
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'icon', maxCount: 1 }])
    , async (req, res) => {

        req.body = JSON.parse(req.body.data || {});

        req.body.avatar = (!req.files) ? false : `/uploads/${req.files.avatar[0].filename}`;
        req.body.icon = (!req.files) ? false : `/uploads/${req.files.icon[0].filename}`;

        let newCat = await addCat(req);

        if (newCat.message && newCat.path && newCat.type && newCat.context)
            return res.status(400).send(newCat.message)

        res.send(newCat);
    });



module.exports = router; 
