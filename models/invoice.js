const Joi = require("joi");
const mongoose = require("mongoose");
const { orderShip, validateAddOrderShip } = require("./orderShip");
const { shipItems, validateAddShipItems } = require("./shipItems");
const { ShipCard } = require("./shipCard");
const { AppSettings } = require("./appSettings");
const {
  PaymentTransaction,
  validateAddPaymentTransaction,
} = require("./paymentTransaction");
const { User } = require("./user");
const _ = require("lodash");
const invoiceSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  numberOfInvoice: {
    type: Number,
    unique: true,
  },

  quantity: {
    type: Number,
  },
  notice: {
    type: String,
  },
  dateCreate: {
    type: Date,
    default: Date.now,
  },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

const validateAddInvoice = (body) => {
  let schema = {
    client: Joi.string().length(24).required(),
    quantity: Joi.number().required(),
    numberOfInvoice: Joi.number(),
    notice: Joi.string(),
  };

  return Joi.validate(body, schema);
};

const validateEditInvoice = (body) => {
  let schema = {
    client: Joi.string().length(24),
    quantity: Joi.number(),
    numberOfInvoice: Joi.number(),
    notice: Joi.string(),
  };

  return Joi.validate(body, schema);
};

const addInvoice = async (input) => {
  const { error } = validateAddInvoice(input.body);
  if (error) return error.details[0];

  let newInvoice = new Invoice(input.body).populate("client", "_id name");
  return await newInvoice.save();
};

const getInvoicesForAdmin = async (input) => {
  return await Invoice.find().populate("client", "_id name");
};
const deleteInvoice = async (id) => {
  return await Invoice.deleteOne({ _id: id });
};

const updateInvoiceForAdmin = async (input) => {
  const { error } = validateEditInvoice(input.body);
  if (error) return error.details[0];

  let body = input.body,
    { id } = input.params;

  let updatedInvoice = await Invoice.findByIdAndUpdate(id, { ...body });

  return updatedInvoice;
};

module.exports = {
  Invoice,
  addInvoice,
  // updateOrderForAdmin,
  // getVendorOrders,
  // getOrders,
  // getOrderDetails,
  // getOrderDetailsForAdmin,
  updateInvoiceForAdmin,
  deleteInvoice,
  getInvoicesForAdmin,
  // getVendorOrderDetails,
};
