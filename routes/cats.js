const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Cat, getCats, addCat, updateCat } = require('../models/cat');
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

        req.body.avatar = (!req.files.avatar) ? false : `/uploads/${req.files.avatar[0].filename}`;
        req.body.icon = (!req.files.icon) ? false : `/uploads/${req.files.icon[0].filename}`;

        let newCat = await addCat(req);

        if (newCat.message && newCat.path && newCat.type && newCat.context)
            return res.status(400).send(newCat.message)

        res.send(newCat);
    });


router.put('/update/:id',
    upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'icon', maxCount: 1 }])
    , async (req, res) => {

        req.body = JSON.parse(req.body.data || {});

        if (req.files.avatar)
            req.body.avatar = `/uploads/${req.files.avatar[0].filename}`;

        if (req.files.icon)
            req.body.icon = `/uploads/${req.files.icon[0].filename}`;            

        let updatedCat = await updateCat(req);

        if (updatedCat.message && updatedCat.path && updatedCat.type && updatedCat.context)
            return res.status(400).send(updatedCat.message)

        res.send(updatedCat);
    });    



module.exports = router; 
