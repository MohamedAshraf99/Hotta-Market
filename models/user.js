const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Joi = require('joi');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  activated: {
    type: Boolean,
    default: false,
  },
  neglected: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  identificationImages: [{
    type: String,
  }],
  type: {
    type: String,
    enum: ['admin','client','vendor','productiveFamily', ],
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  password: {
    type: String,
    minlength: 5,
    maxlength: 1024
  },
  addresses: [{
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
    },
    default: {
      type: Boolean,
      default: false,
    },
    areaDesc: String,
  }],
  dateCreate: {
    type: Date,
    default: Date.now(),
},
});



userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
}
const User = mongoose.model('User', userSchema);


module.exports = {
  User,
}