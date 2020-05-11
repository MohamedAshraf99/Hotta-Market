const Joi = require('joi');
const mongoose = require('mongoose');


const orderShipSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
        required: true,
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    log: [{
        date: {
            type: Date,
            default: Date.now()
        },
        state: {
            type: String,
            default: "new",
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

const validateAddOrderShip = (body) => {
    let schema = {
        provider: Joi.string().length(24).required(),
        order: Joi.string().length(24).required(),
        shipItems: Joi.array().required(),
        log: Joi.array().optional(),
        completed: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}

module.exports = {
    orderShip,
    validateAddOrderShip,
}


