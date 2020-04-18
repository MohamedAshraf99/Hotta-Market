const {authnMW, authrMW} = require('../RBAC_Auth/models/auth');
const { City, addCity, deleteCity, getCities, updateCity } = require('../models/city');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let cities = await getCities(req);
    res.send(cities);
});


router.post('/add', async (req, res) => {
    let newCity = await addCity(req);
    
    if (newCity.message && newCity.path && newCity.type && newCity.context)
        return res.status(400).send(newCity.message)

    res.send(newCity);
});


router.put('/edit/:id', async (req, res) => {
    let updatedCity = await updateCity(req);

    if(updatedCity.message && updatedCity.path && updatedCity.type && updatedCity.context)
        return res.status(400).send(updatedCity.message)

    res.send(updatedCity);
});


router.delete('/delete/:id', async (req, res) => {
    let deletedCity = await deleteCity(req);
    res.send(deletedCity);
});


module.exports = router; 
