const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {Role} = require('../RBAC_Auth/models/role')
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
});



userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
}
const User = mongoose.model('User', userSchema);




async function seedAdminRoleAndAdminUser() {

  let seedAdminRole = async() => {
    let count = await Role.find().count();
  
    if (!count) {
      console.log('creating (admin) role')
      let adminRoleData = {
          name: 'admin',
          owner: true,
      }
  
      let adminRole = new Role(adminRoleData)
  
      return await adminRole.save()
    }
  
    return {}
  
  }

  let count = await User.find({ type: 'admin' }).count();

  let adminRole = await seedAdminRole();

  if (!count && adminRole._id) {
    console.log('creating adminUser Now')
    let userAdmin = {
      phone: '+966admin',
      password: await getHashPassword('123456'),
      isAdmin: true,

    }
    User.insertMany([userAdmin]);
  }

}
seedAdminRoleAndAdminUser();

module.exports = {
  User,
}