const Joi = require('joi');
const mongoose = require('mongoose');


const countrySchema = new mongoose.Schema({
    nameAr: {
        type: String,
        required: true,
        unique: true,
    },
    nameEn: {
        type: String,
        required: true,
        unique: true,
    },
    currency: {
        type: String,
        required: true
    },
    taxPercentage: {
        type: Number,
        default: 0
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


const Country = mongoose.model('Country', countrySchema);

const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).required(),
        nameEn: Joi.string().min(3).required(),
        currency: Joi.string().min(3).required(),
        taxPercentage: Joi.number().min(0).max(100).optional(),        
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).optional(),
        nameEn: Joi.string().min(3).optional(),
        currency: Joi.string().min(3).optional(),
        taxPercentage: Joi.number().min(0).max(100).optional(),
        isNeglected: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}


const getCountries = async (input) => {
    return await Country.find();
}


const getFullPlaces = async (input) => {

    return await Country.aggregate([
        {
            '$lookup': {
                'from': 'cities',
                'localField': '_id',
                'foreignField': 'country',
                'as': 'cities'
            }
        }, {
            '$unwind': {
                'path': '$cities',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$lookup': {
                'from': 'areas',
                'localField': 'cities._id',
                'foreignField': 'city',
                'as': 'cities.areas'
            }
        }, {
            '$group': {
                '_id': '$_id',
                'doc': {
                    '$first': '$$ROOT'
                },
                'cities': {
                    '$push': '$cities'
                }
            }
        }, {
            '$addFields': {
                'doc.cities': '$cities'
            }
        }, {
            '$replaceRoot': {
                'newRoot': '$doc'
            }
        }
    ]);
}

const addCountry = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newCountry = new Country(body)

    newCountry = await newCountry.save();

    return newCountry;
}


const updateCountry = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedCountry = await Country.findByIdAndUpdate(id, body, {new: true})

    return updatedCountry;
}


const deleteCountry = async (input) => {
    let { id } = input.params;
    return await Country.findByIdAndDelete(id)
}


module.exports = {
    Country,
    getCountries,
    addCountry,
    updateCountry,
    deleteCountry,
    getFullPlaces
}


