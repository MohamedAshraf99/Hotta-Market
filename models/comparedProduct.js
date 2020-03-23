const Joi = require('joi');
const mongoose = require('mongoose');


const ComparedProductSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    date: {
        type: Date,
        default: Date.now(),
    },
});


const ComparedProduct = mongoose.model('ComparedProduct', ComparedProductSchema);


module.exports = {
    ComparedProduct,
}


