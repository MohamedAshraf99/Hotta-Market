const Joi = require('joi');
const mongoose = require('mongoose');


const countrySchema = new mongoose.Schema({
    nameAr: {
        type: String,
        required: true
    },
    nameEn: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    taxPercentage: {
        type: Number,
        default: 0
    },
});


const Country = mongoose.model('Country', countrySchema);


module.exports = {
    Country,
}


