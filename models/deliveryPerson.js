const Joi = require('joi');
const mongoose = require('mongoose');


const deliveryPersonSchema = new mongoose.Schema({
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    required: true,
    enum: ['provider', 'admin'],
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


const validateAdd = (body) => {
    let schema = {
        area: Joi.string().length(24).required(),
        provider: Joi.string().length(24).optional(),
        type: Joi.string().required(),
        name: Joi.string().max(50).required(),      
        phone: Joi.string().max(50).required(),      
        whatsApp: Joi.string().max(50).required(),      
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
      area: Joi.string().length(24).optional(),
      name: Joi.string().max(50).optional(),
      provider: Joi.string().length(24).optional(),
      type: Joi.string().optional(),
      phone: Joi.string().max(50).optional(),      
      whatsApp: Joi.string().max(50).optional(),   
      isNeglected: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}

const getAll = async (input) => {

  let {provider=false, area=false, type=false} = input.query;

  let fields = [{ provider }, { area }, { type }]
    .filter(f => f[Object.keys(f)[0]])

    fields = Object.assign({}, ...fields);

  return await DeliveryPerson
  .find({...fields})
  .populate("provider", "_id name")
  .populate({
    path: "area",
    populate: {
      path: 'city',
      populate: {
        path: 'country',
      } 
    }
  });
}

const addDeliveryPerson = async (input) => {

  let body = input.body;

  const { error } = validateAdd(body);
  if (error) return (error.details[0]);

  let newPerson = await DeliveryPerson.create(body)

  return await newPerson
  .populate("provider", "_id name")
  .populate({
    path: "area",
    populate: {
      path: 'city',
      populate: {
        path: 'country',
      } 
    }
  })
  .execPopulate();

}

const updateDeliveryPerson = async (input) => {

  let {id} = input.params;
  let body = input.body;

  const { error } = validateUpdate(body);
  if (error) return (error.details[0]);

  let updatedDeliveryPerson = await DeliveryPerson
  .findByIdAndUpdate(id, body, {new: true})
  .populate("provider", "_id name")
  .populate({
    path: "area",
    populate: {
      path: 'city',
      populate: {
        path: 'country',
      } 
    }
  })

  return updatedDeliveryPerson;
}

module.exports = {
  DeliveryPerson,
  getAll,
  addDeliveryPerson,
  updateDeliveryPerson,
}