const Joi = require('joi');
const mongoose = require('mongoose');


const orderShipSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
        required: true,
    },
    location: {
        area: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
        },
        lat: String,
        lng: String,
        desc: String
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },  
    requiredDateTime: Date,
    log: [{
        date: {
            type: Date,
            default: Date.now()
        },
        state: {
            type: String,
            enum: ['new', 'progress','complete', 'canceled']
        }
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


const orderShip = mongoose.model('orderShip', orderShipSchema);


module.exports = {
    orderShip,
}


