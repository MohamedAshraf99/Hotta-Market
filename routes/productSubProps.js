const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ProductSubProp, addSubProp, deleteSubProp,
    getSubProps, updateSubProp } = require('../models/productSubProp');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let SubProps = await getSubProps(req);
    res.send(SubProps);
});

router.post('/add', async (req, res) => {
    let newSubProp = await addSubProp(req);
    
    if (newSubProp.message && newSubProp.path && newSubProp.type && newSubProp.context)
        return res.status(400).send(newSubProp.message)

    res.send(newSubProp);
});


router.put('/edit/:id', async (req, res) => {
    let updatedSubProp = await updateSubProp(req);

    if(updatedSubProp.message && updatedSubProp.path && updatedSubProp.type && updatedSubProp.context)
        return res.status(400).send(updatedSubProp.message)

    res.send(updatedSubProp);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedSubProp = await deleteSubProp(req);
    res.send(deletedSubProp);
});


module.exports = router; 
