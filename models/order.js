const Joi = require('joi');
const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area",
        required: true,
    },
    requiredDateTime: Date,
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductPrice",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
    }],
    log: [{
        date: Date,
        state: {
            type: String,
            enum: ['new', 'progress', 'prepared', 'complete', 'canceled' ]
        }
    }]
});


const Order = mongoose.model('Order', orderSchema);


module.exports = {
    Order,
}


