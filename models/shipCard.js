const Joi = require('joi');
const mongoose = require('mongoose');


const shipCardSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductPrice",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const ShipCard = mongoose.model('ShipCard', shipCardSchema);


module.exports = {
    ShipCard,
}


