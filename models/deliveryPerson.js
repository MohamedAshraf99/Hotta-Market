const Joi = require('joi');
const mongoose = require('mongoose');


const deliveryPersonSchema = new mongoose.Schema({
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  whatsApp: {
    type: String,
    required: true,
    unique: true,
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

const DeliveryPerson = mongoose.model('DeliveryPerson', deliveryPersonSchema);



module.exports = {
DeliveryPerson,
}


