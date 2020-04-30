const Joi = require('joi');
const mongoose = require('mongoose');


const productPriceSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    props: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductSubProp",
        }],
    avatars: [{
        type: String,
        required: true,
    }],
    price: {
        initialPrice: Number,
        reducedPrice: Number,
        reducedPriceFDate: Date,
        reducedPriceEDate: Date,
        quantity: Number,
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


const ProductPrice = mongoose.model('ProductPrice', productPriceSchema);


module.exports = {
    ProductPrice,
    productPriceSchema,
}


