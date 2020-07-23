const Joi = require("joi");
const mongoose = require("mongoose");

const providerSubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    maxlength: 50,
    required: true,
  },
  period: {
    type: Number,
    required: true,
    min: 1,
  },
  productsCount: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  isNeglected: {
    type: Boolean,
    default: false,
  },
  dateCreate: {
    type: Date,
    default: Date.now,
  },
});

const ProviderSubscriptionPlan = mongoose.model(
  "ProviderSubscriptionPlan",
  providerSubscriptionPlanSchema
);

const validateAdd = (body) => {
  let schema = {
    name: Joi.string().min(3).required(),
    period: Joi.number().min(1).required(),
    productsCount: Joi.number().min(1).required(),
    price: Joi.number().min(0).required(),
  };

  return Joi.validate(body, schema);
};

const validateUpdate = (body) => {
  let schema = {
    isNeglected: Joi.bool().required(),
  };

  return Joi.validate(body, schema);
};

const getPlans = async (input) => {
  return await ProviderSubscriptionPlan.find();
};

const addNewPlan = async (input) => {
  let body = input.body;

  const { error } = validateAdd(body);
  if (error) return error.details[0];

  let newPlan = new ProviderSubscriptionPlan(body);

  newPlan = await newPlan.save();

  return newPlan;
};

const updatePlan = async (input) => {
  let { id } = input.params;
  let body = input.body;

  // const { error } = validateUpdate(body);
  // if (error) return (error.details[0]);

  let updatedPlan = await ProviderSubscriptionPlan.findByIdAndUpdate(id, body, {
    new: true,
  });

  return updatedPlan;
};

const deletePlan = async (input) => {
  let { id = "" } = input.params;
  return await ProviderSubscriptionPlan.findByIdAndDelete(id);
};

module.exports = {
  ProviderSubscriptionPlan,
  getPlans,
  addNewPlan,
  updatePlan,
  deletePlan,
};
