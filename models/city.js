const Joi = require('joi');
const mongoose = require('mongoose');


const citySchema = new mongoose.Schema({
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
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


const City = mongoose.model('City', citySchema);


const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).required(),
        nameEn: Joi.string().min(3).required(),
        country: Joi.string().length(24).required(),       
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


const getCities = async (input) => {
    let {countryId=""} = input.query;

    return await City
    .find({country: countryId});
}


const addCity = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newCity = new City(body)

    newCity = await newCity.save();

    return newCity;
}


const updateCity = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedCity = await City.findByIdAndUpdate(id, body, {new: true})

    return updatedCity;
}


const deleteCity = async (input) => {
    let { id } = input.params;
    return await City.findByIdAndDelete(id)
}


module.exports = {
    City,
    getCities,
    addCity,
    updateCity,
    deleteCity,
}