const Joi = require('joi');
const mongoose = require('mongoose');


const cardSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ProductPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductPrice",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
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


const Card = mongoose.model('Card', cardSchema);


module.exports = {
    Card,
}


