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
    location: {
        area: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
        },
        lat: String,
        lang: String,
        desc: String
    },
    requiredDateTime: Date,
    logs: [{
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        log: [{
            date: {
                type: Date,
                default: Date.now()
            },
            state: {
                type: String,
                enum: ['new', 'progress','complete', 'canceled']
            }
        }]
    }],
    isNeglected: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Order = mongoose.model('Order', orderSchema);


module.exports = {
    Order,
}


