const Joi = require('joi');
const mongoose = require('mongoose');



const pocketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentTransaction",
        required: true,
    },
    currentAmount: {
        type: Number,
        required: true,
    },
    transactionAmount: {
        type: Number,
        required: true,
    },
    transactionTypes: {
        type: String,
        required: true,
        enum: ['deposite', 'withdraw']
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Pocket = mongoose.model('Pocket', pocketSchema);


module.exports = {
    Pocket,
}


