const Joi = require('joi');
const mongoose = require('mongoose');


const orderShipsSchema = new mongoose.Schema({
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
        lang: String,
        desc: String
    },
    vendor: {
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


const orderShips = mongoose.model('orderShips', orderShipsSchema);


module.exports = {
    orderShips,
}


