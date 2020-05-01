const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ProductMainProp, addMainProp, deleteMainProp, getAllProps,
    getMainProps, updateMainProp } = require('../models/productMainProp');
const express = require('express');
const router = express.Router();


router.get('/', [authrMW], async (req, res) => {
    let mainProps = await getMainProps();
    res.send(mainProps);
});


router.get('/getAllProps', async (req, res) => {
    let allProps = await getAllProps();
    res.send(allProps);
});


router.post('/add', async (req, res) => {
    let newMainProp = await addMainProp(req);
    
    if (newMainProp.message && newMainProp.path && newMainProp.type && newMainProp.context)
        return res.status(400).send(newMainProp.message)

    res.send(newMainProp);
});


router.put('/edit/:id', async (req, res) => {
    let updatedMainProp = await updateMainProp(req);

    if(updatedMainProp.message && updatedMainProp.path && updatedMainProp.type && updatedMainProp.context)
        return res.status(400).send(updatedMainProp.message)

    res.send(updatedMainProp);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedMainProp = await deleteMainProp(req);
    res.send(deletedMainProp);
});


module.exports = router; 
