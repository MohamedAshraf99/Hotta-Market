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
  providerStatus: Boolean,
  avatar: {
    type: String,
    required: true,
  },
  commercialName: String,
  commercialNumber: String,
  desc: String,
  icon: String,
  phone: {
    type: String,
    required: true,
  },
  contacts: [{
    contact: String,
    name: String,
    job: String,
    default: {
      type: Boolean,
      default: false
    }
  }],
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
  callsCount: Number,
  location: {
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
    },
    desc: String,
    lng: Number,
    lat: Number
  },
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
      icon: Joi.string().optional(),
      commercialName: Joi.string().optional(),
      commercialNumber: Joi.string().optional(),
      desc: Joi.string().optional(),
      phone: Joi.string().required(),
      contacts: Joi.array().optional(),
      email: Joi.string().required(),
      type: Joi.string().required(),
      password: Joi.string().min(5).required(),
      location: Joi.object().optional(),
      role: Joi.string().length(24).optional(),
  };

  return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
  let schema = {
    name: Joi.string().min(5).optional(),
    isActivated: Joi.bool().optional(),
    avatar: Joi.string().optional(),
    icon: Joi.string().optional(),
    commercialName: Joi.string().optional(),
    commercialNumber: Joi.string().optional(),
    desc: Joi.string().optional(),
    phone: Joi.string().optional(),
    contacts: Joi.array().optional(),
    email: Joi.string().optional(),
    password: Joi.string().min(2).optional(),
    location: Joi.object().optional(),
    isNeglected: Joi.bool().optional(),
    providerStatus: Joi.bool().optional(),
    connectionId: Joi.string().optional(),
    deviceId: Joi.array().optional(),
  };

  return Joi.validate(body, schema);
}


const validateLogin = (body) => {
  let schema = {
      phone: Joi.string().required(),
      password: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
}

const validateChangePassword = (body) => {
  let schema = {
      phone: Joi.string().required(),
      password: Joi.string().min(5).required(),
      newPassword: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
}

const validateResetPassword = (body) => {
  let schema = {
      phone: Joi.string().required(),
      password: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
}

const validateActivate = (body) => {
  let schema = {
      phone: Joi.string().required(),
      code: Joi.string().min(5).required(),
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

  let { startId = false, limit = 10, all = false, filter="{}", fields="{}", } = input.query;

  startId = (!startId || startId == "false") ? false: startId

  startId = (all || !startId) ? {} : { '_id': { '$gt': startId } };
  limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);


  fields = JSON.parse(fields)

  fields = Object.keys(fields)
    .reduce((ac, f) => `${ac} ${fields[f] == "1" ? "" : "-"}${f}`, '')


  let users = await User
  .find({ ...startId, ...JSON.parse(filter) })
  .select(fields)
  .populate("role")
  .limit(limit);

  if (users.length)
    users = users.map(user => {
      if(fields.avatar != 0){
        if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
        else user.avatar = input.app.get('defaultAvatar')(input)
      }

      if (fields.icon != 0 && user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon

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

  
  body.password = await getHashPassword(body.password);
  body.isActivated = body.type == "admin" ? true: false;
  body.latestActivationCode = activationCode;

  if (['productiveFamily', 'vendor'].includes(body.type))
    body.providerStatus = true;

  let user = new User(body)
  user = await user.save();

   let code = body.type == "admin" ? "Send Successful" : await sendMessage(user.phone, activationCode);
 //if (true) {
   code = code.replace(/^\s+|\s+$/g, '').trim();
   if (user._id && (code == "Send Successful")) {
      if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
      else user.avatar = input.app.get('defaultAvatar')(input)

      if (user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon
      
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

      if (user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon
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

    let user = await User.findOne({ phone });

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

      if (ret.icon) ret.icon = input.app.get('defaultAvatar')(input, 'host') + ret.icon
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

  if (user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon

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

  if (user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon

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
  let user = await User.findOne({ phone });
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

      if (user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon

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
  let user = await User
  .findById(id)
  .populate('role')
  .populate({
    path: "location.area",
    populate: {
      path: 'city',
      populate: {
        path: 'country',
      } 
    }
  });

  if (user._id) {
    if (user.avatar) user.avatar = input.app.get('defaultAvatar')(input, 'host') + user.avatar
    else user.avatar = input.app.get('defaultAvatar')(input)

    if (user.icon) user.icon = input.app.get('defaultAvatar')(input, 'host') + user.icon
  }

  return ({
    ..._.omit(user.toObject(),
      ['password',
        '__v'
      ]),
  });
}

async function getProducts(input) {
  let startId = input.params.id;
  
  console.log(startId)
  let aggr = [
      {
        '$match': {
          '_id': mongoose.Types.ObjectId(startId),
          'isNeglected': false
        }
      },
      {
          '$lookup': {
            'from': 'products', 
            'localField': '_id', 
            'foreignField': 'vendor', 
            'as': 'products'
          }
      },
      {
          '$unwind': {
            'path': '$products',
            'preserveNullAndEmptyArrays': true
          }
        },
          {
          '$lookup': {
            'from': 'productPrices', 
            'localField': 'products._id', 
            'foreignField': 'product', 
            'as': 'productPrices'
          }
      },
      {
          '$unwind': {
            'path': '$productPrices',
            'preserveNullAndEmptyArrays': true
          }
        },
      {
          '$addFields': {
            'products.price': "$productPrices.prices",
          }
        },
        {
          '$addFields': {
            'products.type': "$type",
          }
        },
          {
            '$group': {
             '_id': '$products',
             'subCategoryImage': {
              '$first': '$avatar'
          },
             }
         },
         {
          '$addFields': {
            'subCategoryImage': { $concat: [input.app.get('defaultAvatar')(input, 'host'), "$subCategoryImage"] },
          }
        },
         {
          '$project': {
              'subCategoryImage': 1,
              '_id._id': 1,
              '_id.nameAr': 1,
              '_id.nameEn': 1,
              '_id.avatar': 1,
              '_id.type': 1,
              '_id.price.initialPrice': 1,
              '_id.price.reducedPrice': 1,
              '_id.newPrice': { "$subtract": ['$_id.price.initialPrice',{"$multiply": [ { "$divide": ["$_id.price.reducedPrice",100] }, '$_id.price.initialPrice' ]}]},
          }
         }, 
         
    ];
    let getProducts = await User.aggregate(aggr);
    getProducts = getProducts.map(product => {
      product._id.avatar = product._id.avatar.map(avatar=>{avatar= input.app.get('defaultAvatar')(input, 'host') + avatar ;return avatar })
      return product;
  })
    return (getProducts);
}



async function getCart(input) {
  let startId = input.params.id;
  
  console.log(startId)
  let aggr = [
      {
        '$match': {
          '_id': mongoose.Types.ObjectId(startId),
          'isNeglected': false
        }
      },
        {
          '$lookup': {
            'from': 'shipcards', 
            'localField': '_id', 
            'foreignField': 'client', 
            'as': 'shipcards'
          }
      },
      {
          '$unwind': {
            'path': '$shipcards',
            'preserveNullAndEmptyArrays': true
          }
        },
        {
          '$lookup': {
            'from': 'productPrices', 
            'localField': 'shipcards.productPrice', 
            'foreignField': '_id', 
            'as': 'productPrices'
          }
      },
      {
          '$unwind': {
            'path': '$productPrices',
            'preserveNullAndEmptyArrays': true
          }
        },
      {
          '$lookup': {
            'from': 'products', 
            'localField': 'productPrices.product', 
            'foreignField': '_id', 
            'as': 'products'
          }
      },
      {
          '$unwind': {
            'path': '$products',
            'preserveNullAndEmptyArrays': true
          }
        },
      
      {
          '$addFields': {
            'products.price': "$productPrices.prices",
            'products.quantity': "$shipcards.quantity",
          }
        },
          {
            '$group': {
             '_id': '$products',
             
             }
         },
         {
          '$project': {
              '_id._id': 1,
              '_id.nameAr': 1,
              '_id.nameEn': 1,
              '_id.avatar': 1,
              '_id.quantity': 1,
              '_id.price.initialPrice': 1,
              '_id.price.reducedPrice': 1,
              '_id.newPrice': { "$subtract": ['$_id.price.initialPrice',{"$multiply": [ { "$divide": ["$_id.price.reducedPrice",100] }, '$_id.price.initialPrice' ]}]},
          }
         },
    ];
    let getProducts = await User.aggregate(aggr);
    getProducts = getProducts.map(product => {
      product._id.avatar = product._id.avatar.map(avatar=>{avatar= input.app.get('defaultAvatar')(input, 'host') + avatar ;return avatar })
      return product;
  });
  let sum = 0;
  let totalPrice = getProducts.map((product)=>{
    sum+=product._id.newPrice;return sum ;
  })
  getProducts[0]._id.totalPrice = totalPrice[totalPrice.length-1];
    return (getProducts);
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
  sendActivationCode,
  getProducts,
  getCart
}