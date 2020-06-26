const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { ProviderSubscriptionPlan, addNewPlan, deletePlan,
    getPlans, updatePlan } = require('../models/providerSubscriptionPlan');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let plans = await getPlans();
    res.send(plans);
});


router.post('/add', async (req, res) => {
    let newPlan = await addNewPlan(req);
    
    if (newPlan.message && newPlan.path && newPlan.type && newPlan.context)
        return res.status(400).send(newPlan.message)

    res.send(newPlan);
});


router.put('/edit/:id', async (req, res) => {
    let updatedPlan = await updatePlan(req);

    if(updatedPlan.message && updatedPlan.path && updatedPlan.type && updatedPlan.context)
        return res.status(400).send(updatedPlan.message)

    res.send(updatedPlan);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedPlan = await deletePlan(req);
    res.send(deletedPlan);
});


module.exports = router; 
