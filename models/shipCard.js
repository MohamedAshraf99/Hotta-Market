const Joi = require('joi');
const mongoose = require('mongoose');


const shipCardSchema = new mongoose.Schema({
    productPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductPrice",
        required: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
    }
});


const ShipCard = mongoose.model('ShipCard', shipCardSchema);


module.exports = {
    ShipCard,
}


