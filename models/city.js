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
});


const City = mongoose.model('City', citySchema);


module.exports = {
    City,
}


