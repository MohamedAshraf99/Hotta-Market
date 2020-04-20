const Joi = require('joi');
const mongoose = require('mongoose');


const areaSchema = new mongoose.Schema({
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },
    nameAr: {
        type: String,
        required: true
    },
    nameEn: {
        type: String,
        required: true
    },
    isNeglected: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Area = mongoose.model('Area', areaSchema);


const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).required(),
        nameEn: Joi.string().min(3).required(),
        city: Joi.string().length(24).required(),       
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).optional(),
        nameEn: Joi.string().min(3).optional(),
        isNeglected: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}


const getAreas = async (input) => {
    let {cityId=""} = input.query;

    return await Area
    .find({city: cityId});
}

const getDifferentAreas = async (input) => {
    let {ids=""} = input.query;

    ids = ids.split(',');

    return await Area
    .find({_id: {$in: ids}})
    .populate({ 
        path: 'city',
        populate: {
          path: 'country',
          model: 'Country'
        } 
     });
}


const addArea = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newArea = new Area(body)

    newArea = await newArea.save();

    return newArea;
}


const updateArea = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedArea = await Area.findByIdAndUpdate(id, body, {new: true})

    return updatedArea;
}


const deleteArea = async (input) => {
    let { id } = input.params;
    return await Area.findByIdAndDelete(id)
}


module.exports = {
    Area,
    getAreas,
    addArea,
    updateArea,
    deleteArea,
    getDifferentAreas
}


