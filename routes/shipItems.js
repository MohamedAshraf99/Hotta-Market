const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { General } = require('../models/general');
const { shipItems, getBestSelling,getTrending } = require('../models/shipItems');
const express = require('express');
const router = express.Router();

router.get('/getBestSelling', async (req, res) => {

    let bestSelling = await getBestSelling(req);

    if (bestSelling.message && bestSelling.path && bestSelling.type && bestSelling.context)
        return res.status(400).send(bestSelling.message)

    res.send(bestSelling);
});
router.get('/getTrending', async (req, res) => {

    let trending = await getTrending(req);

    if (trending.message && trending.path && trending.type && trending.context)
        return res.status(400).send(trending.message)

    res.send(trending);
});

module.exports = router; 