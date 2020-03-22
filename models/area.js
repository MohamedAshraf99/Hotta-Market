const Joi = require('joi');
const mongoose = require('mongoose');


const areaSchema = new mongoose.Schema({
    city: {
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
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Area = mongoose.model('Area', areaSchema);


module.exports = {
    Area,
}


