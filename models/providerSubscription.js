const Joi = require('joi');
const mongoose = require('mongoose');



const providerSubscriptionSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  providerSubscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProviderSubscriptionPlan"
  },
  from: {
    type: Date,
    default: Date.now
  },
  to: Date,
  percentage: Number,
  status: {
    type: Boolean,
    default: true
  },
  dateCreate: {
    type: Date,
    default: Date.now
  }
});

const ProviderSubscription = mongoose.model('ProviderSubscription', providerSubscriptionSchema);


const validateAdd = (body) => {
    let schema = {
        provider: Joi.string().length(24).required(),
        providerSubscriptionPlan: Joi.string().length(24).optional(),
        from: Joi.date().optional(), 
        to: Joi.date().optional(), 
        percentage: Joi.number().optional(),
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
      status: Joi.bool().required(), 
    };

    return Joi.validate(body, schema);
}


const getSubscriptions = async (input) => {

  let provider = input.query.provider || "";

    return await ProviderSubscription
    .find({provider})
    .populate("providerSubscriptionPlan");
}

const addNewSubscription = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newSubscription = new ProviderSubscription(body)

    newSubscription = await newSubscription.save();

    let ret = await ProviderSubscription
    .findOne({_id:newSubscription._id})
    .populate("providerSubscriptionPlan")
    
    return ret;
}


const updateSubscription = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedSubscription = await ProviderSubscription.findByIdAndUpdate(id, body, {new: true})

    return updatedSubscription;
}


const deleteSubscription = async (input) => {
    let { id="" } = input.params;
    return await ProviderSubscription.findByIdAndDelete(id)
}

const checkAllStatus = async () => {
  ProviderSubscription
    .updateMany(
      { to: { $gt: new Date() } },
      { status: false }
    )
}


module.exports = {
    ProviderSubscription,
    getSubscriptions,
    addNewSubscription,
    updateSubscription,
    deleteSubscription,
    checkAllStatus
}


