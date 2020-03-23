const Joi = require('joi');
const mongoose = require('mongoose');


const paymentTransactionSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    method: {
        type: String,
        required: true,
        enum: ['COD', 'credit', 'balance', 'sadad']
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


const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);


module.exports = {
    PaymentTransaction,
}


