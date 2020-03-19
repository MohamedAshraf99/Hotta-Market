const Joi = require('joi');
const mongoose = require('mongoose');



const productMainPropSchema = new mongoose.Schema({  
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


const ProductMainProp = mongoose.model('ProductMainProp', productMainPropSchema);


module.exports = {
    ProductMainProp,
}


