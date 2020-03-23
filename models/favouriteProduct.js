const Joi = require('joi');
const mongoose = require('mongoose');


const favouriteProductSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    date: {
        type: Date,
        default: Date.now(),
    },
});


const FavouriteProduct = mongoose.model('FavouriteProduct', favouriteProductSchema);


module.exports = {
    FavouriteProduct,
}


