const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { DeliveryPerson, addDeliveryPerson, updateDeliveryPerson, getAll, } = require('../models/deliveryPerson');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let persons = await getAll();
    res.send(persons);
});


router.post('/add', async (req, res) => {
    let newPerson = await addDeliveryPerson(req);
    
    if (newPerson.message && newPerson.path && newPerson.type && newPerson.context)
        return res.status(400).send(newPerson.message)

    res.send(newPerson);
});


router.put('/edit/:id', async (req, res) => {
    let updatedPerson = await updateDeliveryPerson(req);

    if(updatedPerson.message && updatedPerson.path && updatedPerson.type && updatedPerson.context)
        return res.status(400).send(updatedPerson.message)

    res.send(updatedPerson);
});


module.exports = router; 
