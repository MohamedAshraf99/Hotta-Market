const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ProviderSubscription, addNewSubscription, deleteSubscription,
        getSubscriptions, updateSubscription } = require('../models/providerSubscription');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let subs = await getSubscriptions(req);
    res.send(subs);
});


router.post('/add', async (req, res) => {
    let newSub = await addNewSubscription(req);
    
    if (newSub.message && newSub.path && newSub.type && newSub.context)
        return res.status(400).send(newSub.message)

    res.send(newSub);
});


router.put('/edit/:id', async (req, res) => {
    let updatedSub = await updateSubscription(req);

    if(updatedSub.message && updatedSub.path && updatedSub.type && updatedSub.context)
        return res.status(400).send(updatedSub.message)

    res.send(updatedSub);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedSub = await deleteSubscription(req);
    res.send(deletedSub);
});


module.exports = router; 
