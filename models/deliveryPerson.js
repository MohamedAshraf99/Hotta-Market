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


const validateAdd = (body) => {
    let schema = {
        area: Joi.string().length(24).required(),
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
      phone: Joi.string().max(50).optional(),      
      whatsApp: Joi.string().max(50).optional(),   
      isNeglected: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}

const getAll = async (input) => {
  return await DeliveryPerson
  .find()
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