const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const Joi = require('joi');
const _ = require("lodash")
const {t2} = require("../services/langs")

const {getHashPassword, sendMessage, randomString} = require('../services/helper')


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 50,
  },
  isActivated: {
    type: Boolean,
    default: false,
  },
  isNeglected: {
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
  // identificationImages: [{
  //   type: String,
  // }],
  type: {
    type: String,
    enum: ['admin','client','vendor','productiveFamily'],
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
  latestActivationCode: String,
  connectionId: {
    type: String,
    default: null
  },
  deviceId: [{
    type: String
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

 
const validateRegister = (body) => {
  let schema = {
      name: Joi.string().min(5).required(),
      isActivated: Joi.bool().optional(),
      avatar: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().required(),
      type: Joi.string().required(),
      password: Joi.string().min(2).required(),
      addresses: Joi.array().optional(),
      role: Joi.string().length(24).optional(),
  };

  return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
  let schema = {
    name: Joi.string().min(5).optional(),
    isActivated: Joi.bool().optional(),
    avatar: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().optional(),
    password: Joi.string().min(2).optional(),
    addresses: Joi.array().optional(),
    isNeglected: Joi.bool().optional(),
    connectionId: Joi.string().optional(),
    deviceId: Joi.array().optional(),
  };

  return Joi.validate(body, schema);
}


const validateLogin = (body) => {
  let schema = {
      phone: Joi.string().required(),
      password: Joi.string().min(2).required(),
  };

  return Joi.validate(body, schema);
}

const validateChangePassword = (body) => {
  let schema = {
      phone: Joi.string().required(),
      password: Joi.string().min(2).required(),
      newPassword: Joi.string().min(2).required(),
  };

  return Joi.validate(body, schema);
}

const validateResetPassword = (body) => {
  let schema = {
      phone: Joi.string().required(),
      password: Joi.string().min(2).required(),
  };

  return Joi.validate(body, schema);
}

const validateActivate = (body) => {
  let schema = {
      phone: Joi.string().required(),
      code: Joi.string().min(2).required(),
  };

  return Joi.validate(body, schema);
}

const validateSendActivationCode = (body) => {
  let schema = {
      phone: Joi.string().required(),
  };

  return Joi.validate(body, schema);
}


const getUsers = async (input) => {

  let { startId = false, limit = 10, all = false, filter="{}", fields="{}" } = input.query;

  startId = (!startId || startId == "false") ? false: startId

  startId = (all || !startId) ? {} : { '_id': { '$gt': startId } };
  limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);

  let users = await User.find(
    { ...startId, ...JSON.parse(filter) },
    { ...JSON.parse(fields) }
  )
  .populate("role")
  .limit(limit);

  if (users.length)
    users = users.map(user => {

      if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
      else user.avatar = input.app.get('defaultAvatar')(input)

      return (
        _.omit(user.toObject(),
          ['password',
            'latestActivationCode',
            'connectionId',
            'deviceId',
            '__v'])
      );
    });

  return users
}


const register = async (input) => {

  let body = input.body,
      activationCode = randomString(4, "#");

  const { error } = validateRegister(body);
  if (error) return (error.details[0]);


  let checkUser = await User.findOne({
    $or: [
      { phone: body.phone },
      { email: body.email },
      { name: body.name },
    ]
  });
   if(checkUser){
   if (checkUser.name == body.name) {return t2(input.header('Accept-Language'),'name already registered.');}
   else if (checkUser.phone == body.phone) return t2(input.header('Accept-Language'),'Phone already registered.');
   else if (checkUser.email == body.email) return t2(input.header('Accept-Language'),'Email already registered.');
   }
   
  if (!body.role) {
    let Role = mongoose.model("Role"),
      userRole = await Role.findOne({ name: body.type })

    if (userRole._id) body.role = userRole._id;
  }

  
  body.password = await getHashPassword(input.body.password);
  body.isActivated = body.type == "admin" ? true: false;
  body.latestActivationCode = activationCode;

  let user = new User(body)
  user = await user.save();

   let code = body.type == "admin" ? "Send Successful" : await sendMessage(user.phone, activationCode);
 //if (true) {
   code = code.replace(/^\s+|\s+$/g, '').trim();
   if (user._id && (code == "Send Successful")) {
      if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
      else user.avatar = input.app.get('defaultAvatar')(input)
      
    // i will show activation code in the response for mahmoud for testing purpose don't forget to delete it from response after that
    return (
      _.omit(user.toObject(),
        ['password',
          //'latestActivationCode',
          'connectionId',
          'deviceId',
          '__v'])
    );

  }
  else return "cant create user"

}


const updateUser = async (input) => {

  let body = input.body,
      {id} = input.params

  const { error } = validateUpdate(body);
  if (error) return (error.details[0]);

  let user = await User.findByIdAndUpdate(id, body, {new: true});
  if (!user) return t2(input.header('Accept-Language'),'Invalid Phone or password.');
 
    if (user._id) {
      if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
      else user.avatar = input.app.get('defaultAvatar')(input)
    }
  
    return (
      _.omit(user.toObject(),
        ['password',
          'latestActivationCode',
          'connectionId',
          'deviceId',
          '__v'])
    );
}


async function login(input){

  const { error } = validateLogin(input.body);
  if (error) return (error.details[0]);

  let {phone, password} = input.body

    if (!phone || !password) return t2(input.header('Accept-Language'),'Invalid phone or password.');

    let user = await User.findOne({ phone: phone });

    if (!user) return t2(input.header('Accept-Language'),'Invalid phone or password.');


    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return t2(input.header('Accept-Language'),'Invalid password.');
  
    const token = user.generateAuthToken();
  
    ret = {
      ..._.omit(user.toObject(),
        ['password',
          'latestActivationCode',
          'connectionId',
          'deviceId',       
          '__v'
        ]),
      ...{ token: token }
    };

    if (user._id) {
      if (ret.avatar) ret.avatar = input.app.get('defaultAvatar')(input, 'host') + ret.avatar
      else ret.avatar = input.app.get('defaultAvatar')(input)
    }
    
    return ret;
}

async function changePassword(input){

  const { error } = validateChangePassword(input.body);
  if (error) return (error.details[0]);

  let {phone, password, newPassword} = input.body

  let user = await User.findOne({ phone });
  if (!user) return t2(input.header('Accept-Language'),'Invalid Phone or password.');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return t2(input.header('Accept-Language'),'Invalid  password.');

  user.password = await getHashPassword(newPassword);
  await user.save();

  return (user._id? true: false);
}


async function resetPassword(input){

  const { error } = validateResetPassword(input.body);
  if (error) return (error.details[0]);

  let {phone, password} = input.body

  let user = await User.findOne({ phone });
  if (!user) return t2(input.header('Accept-Language'),'Invalid email or password.');


  user.password = await getHashPassword(password);
  await user.save();

  const token = user.generateAuthToken();

  if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
  else user.avatar = input.app.get('defaultAvatar')(input)

  return ({
    ..._.omit(user.toObject(),
      ['password',
        'latestActivationCode',
        'connectionId',
        'deviceId',
        '__v'
      ]),

    ...{ token: token }
  });

}

async function activate(input){

  const { error } = validateActivate(input.body);
  if (error) return (error.details[0]);

  let {phone, code} = input.body

  let user = await User.findOne({ phone });

  if(user._id && user.latestActivationCode == code ){
    user.isActivated = true
    await user.save()
  }

  const token = user.generateAuthToken();

  if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
  else user.avatar = input.app.get('defaultAvatar')(input)

  return ({
    ..._.omit(user.toObject(),
      ['password',
        'latestActivationCode',
        'connectionId',
        'deviceId',
        '__v'
      ]),

    ...{ token: token }
  });

}

async function sendActivationCode(input){

  const { error } = validateSendActivationCode(input.params);
  if (error) return (error.details[0]);

  let {phone} = input.params,
  latestActivationCode = randomString(4, "#");
  let user = await User.findOne(
      { phone: phone }
);
  if(!user){
    return "user not registered";
  }     
else{
      
  let code = await sendMessage(user.phone, latestActivationCode);
  code = code.replace(/^\s+|\s+$/g, '').trim();
  
 //if (true) {
  if (user._id && (code == "Send Successful")) {

  let user = await User.findOneAndUpdate({ phone }, {latestActivationCode}, {new: true});

      if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
      else user.avatar = input.app.get('defaultAvatar')(input)

  const token = user.generateAuthToken();

   return ({
     ..._.omit(user.toObject(),
       ['connectionId',
         'deviceId',
         '__v']),
     ...{ token: token }
   });

  }
}
}


async function getUser(input) {
  let {id} = input.params
  let user = await User.findById(id);

  if (user._id) {
    if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
    else user.avatar = input.app.get('defaultAvatar')(input)
  }

  return ({
    ..._.omit(user.toObject(),
      ['password',
        '__v'
      ]),
  });
}


module.exports = {
  User,
  register,
  login,
  changePassword,
  updateUser,
  resetPassword,
  getUser,
  getUsers,
  activate,
  sendActivationCode
}