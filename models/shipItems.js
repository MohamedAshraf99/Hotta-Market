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
    rate:{
        positive: {
            type: String,
            required: true,
        },
        negative: {
            type: String,
            required: true,
        },
        rate:{
            type: Number,
            required: true,
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


module.exports = {
    shipItems,
}


