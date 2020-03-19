const Joi = require('joi');
const mongoose = require('mongoose');



const coboneSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cat",
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    productPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductPrice",
    },   
    announcement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Announcement",
    },
    minimumPriceCondition: Number,
    percentage: Number,
    value: Number,
    type: {
        type: String,
        required: true,
        enum: ['invoice', 'cat', 'product', 'productPrice', 'announcement']
    },
    fromDate: {
        type: Date,
        default: Date.now(),
    },
    toDate: {
        type: Date,
        required: true,
    }
});


const Cobone = mongoose.model('Cobone', coboneSchema);


module.exports = {
    Cobone,
}


