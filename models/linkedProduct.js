const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash')



const linkedProductSchema = new mongoose.Schema({
    product1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    product2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
  },
    dateCreate: {
        type: Date,
        default: Date.now
    },
});


const LinkedProduct = mongoose.model('LinkedProduct', linkedProductSchema);


module.exports = {
LinkedProduct
}


