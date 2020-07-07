const { General, validateGeneral } = require('../models/general');
const express = require('express');
const router = express.Router();



// /grneral?page=1
router.get('', async (req, res) => {
    const page = req.query.page;
    let docs = await General.find({page : (page || 1)});
    res.send(docs);
})
 

router.post('/add', async (req, res) => {
    const page = req.query.page;
    if (req.body._id){
        const { error } = validateGeneral(req.body  , 'update');
        if (error) return res.status(400).send(error.details[0].message);
    }else{
        const { error } = validateGeneral(req.body);
        if (error) return res.status(400).send(error.details[0].message);
    }
    
    let object = req.body ; 
    object.page = page;

    if (req.body._id){
        await General.updateOne({_id :req.body._id } , object);
    }else{
        await General.insertMany([object]);
    }
    let docs = await General.find({page : (page || 1)});
    res.send(docs);
    
})

router.delete('/delete/:id', async (req, res) => {
    await General.findByIdAndRemove({ _id: req.params.id });
    res.status(200).send();
})

module.exports = router; 
