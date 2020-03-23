const Joi = require('joi');
const mongoose = require('mongoose');



const productSubPropSchema = new mongoose.Schema({
    productMainProp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMainProp",
        required: true,
    },
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


const ProductSubProp = mongoose.model('ProductSubProp', productSubPropSchema);


module.exports = {
    ProductSubProp,
}


