const Joi = require('joi');
const mongoose = require('mongoose');


const shipItemsSchema = new mongoose.Schema({
    orderShips: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderShips",
        required: true,
    },
    product: {
        productPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productPrice",
        required: true
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
    },  
    requiredDateTime: Date,
    rate:{
        positive: {
            type: String,
        },
        negative: {
            type: String,
        },
        rate:{
            type: Number,
        }
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


const shipItems = mongoose.model('shipItems', shipItemsSchema);
const validateAddShipItems = (body) => {
    let schema = {
        orderShips: Joi.string().length(24).required(),
        requiredDateTime: Joi.date().required(),
        rate: Joi.object().optional(),
        product: Joi.object().required(),
    };

    return Joi.validate(body, schema);
}

module.exports = {
    shipItems,
    validateAddShipItems,
}


