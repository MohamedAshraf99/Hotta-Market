const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Announcement,getAnnouncements } = require('../models/announcement');
const express = require('express');
const router = express.Router();

router.get('/getAnnouncements', async (req, res) => {

    let announcement = await getAnnouncements(req);

    if (announcement.message && getAnnouncements.path && announcement.type && announcement.context)
        return res.status(400).send(announcement.message)

    res.send(announcement);
});

module.exports = router; 
