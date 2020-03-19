const Joi = require('joi');
const mongoose = require('mongoose');



const productSubPropSchema = new mongoose.Schema({
    productMainProp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMainProp",
        required: true,
    },
    name: {
        type: String,
        maxlength: 50,
        required: true,
    },
    details: {
        maxlength: 1024,
        type: String,
    },
});


const ProductSubProp = mongoose.model('ProductSubProp', productSubPropSchema);


module.exports = {
    ProductSubProp,
}


