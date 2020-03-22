const Joi = require('joi');
const mongoose = require('mongoose');


const productPriceSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    props: [{
        productSubProp: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductSubProp",
        },
        value: String
    }],  
    prices: [{
        date: Date,
        // initialPrice: Number,
        // reducedPrice: Number,
        // reducedPriceFDate: Date,
        // reducedPriceEDate: Date,
        costPrice: Number,
        quantity: Number,
    }],
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const ProductPrice = mongoose.model('ProductPrice', productPriceSchema);


module.exports = {
    ProductPrice,
}


