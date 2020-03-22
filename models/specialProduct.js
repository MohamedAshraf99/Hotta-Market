const Joi = require('joi');
const mongoose = require('mongoose');


const specialProductSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    favouriteProducts: [{
        date: {
            type: Date,
            default: Date.now(),
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }
    }],
    comparedProducts: [{
        date: {
            type: Date,
            default: Date.now(),
        },
        products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }]
    }],
});


const SpecialProduct = mongoose.model('SpecialProduct', specialProductSchema);


module.exports = {
    SpecialProduct,
}


