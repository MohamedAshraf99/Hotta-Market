const Joi = require('joi');
const mongoose = require('mongoose');



const productSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cat",
        required: true,
    },
    linkedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    linkedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],        
    nameAr: {
        type: String,
        required: true,
    },
    nameEn: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        unique: true,
        required: true,
    },
    taxState: {
        type: Boolean,
        default: false,
    },    
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Product = mongoose.model('Product', productSchema);


module.exports = {
    Product,
}


