const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Area, addArea, deleteArea, getAreas, updateArea } = require('../models/area');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let areas = await getAreas(req);
    res.send(areas);
});


router.post('/add', async (req, res) => {
    let newArea = await addArea(req);
    
    if (newArea.message && newArea.path && newArea.type && newArea.context)
        return res.status(400).send(newArea.message)

    res.send(newArea);
});


router.put('/edit/:id', async (req, res) => {
    let updatedArea = await updateArea(req);

    if(updatedArea.message && updatedArea.path && updatedArea.type && updatedArea.context)
        return res.status(400).send(updatedArea.message)

    res.send(updatedArea);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedArea = await deleteArea(req);
    res.send(deletedArea);
});


module.exports = router; 
