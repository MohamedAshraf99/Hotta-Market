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


module.exports = {
    Country,
}


