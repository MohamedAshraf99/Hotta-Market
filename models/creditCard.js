const Joi = require('joi');
const mongoose = require('mongoose');


const creditCardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    iban: {
        type: String,
    },
    type: {
        type: String,
        required: true,
        enum: [],
    },
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    securityCode: {
        type: String,
        required: true
    },
    expireMonth: {
        type: Number,
        required: true,
        enum: [...Array(12).keys()].map( i => i+1),
    },
    expireYear: {
        type: Number,
        required: true
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


const CreditCard = mongoose.model('CreditCard', creditCardSchema);


module.exports = {
    CreditCard,
}


