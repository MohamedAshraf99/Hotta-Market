const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Cat, getCats } = require('../models/cat');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let cats = await getCats();
    res.send(cats);
});

module.exports = router; 
