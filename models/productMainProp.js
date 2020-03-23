const Joi = require('joi');
const mongoose = require('mongoose');



const productMainPropSchema = new mongoose.Schema({  
    nameAr: {
        type: String,
        maxlength: 50,
        required: true,
    },
    nameEn: {
        type: String,
        maxlength: 50,
        required: true,
    },
    details: {
        maxlength: 1024,
        type: String,
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


const ProductMainProp = mongoose.model('ProductMainProp', productMainPropSchema);


module.exports = {
    ProductMainProp,
}


