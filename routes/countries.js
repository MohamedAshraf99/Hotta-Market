const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { Country, addCountry, deleteCountry, getCountries, updateCountry, getFullPlaces } = require('../models/country');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let countries = await getCountries();
    res.send(countries);
});


router.get('/getFullPlaces', async (req, res) => {
    let fullPlaces = await getFullPlaces();
    res.send(fullPlaces);
});


router.post('/add', async (req, res) => {
    let newCountry = await addCountry(req);
    
    if (newCountry.message && newCountry.path && newCountry.type && newCountry.context)
        return res.status(400).send(newCountry.message)

    res.send(newCountry);
});


router.put('/edit/:id', async (req, res) => {
    let updatedCountry = await updateCountry(req);

    if(updatedCountry.message && updatedCountry.path && updatedCountry.type && updatedCountry.context)
        return res.status(400).send(updatedCountry.message)

    res.send(updatedCountry);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedCountry = await deleteCountry(req);
    res.send(deletedCountry);
});


module.exports = router; 
