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
  method: {
    type: String,
    enum: ["pay", "taking"],
    required: true,
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
    method: Joi.string().required(),
  };

  return Joi.validate(body, schema);
};

const validateEditInvoice = (body) => {
  let schema = {
    client: Joi.string().length(24),
    quantity: Joi.number(),
    numberOfInvoice: Joi.number(),
    notice: Joi.string(),
    method: Joi.string(),
  };

  return Joi.validate(body, schema);
};

const addInvoice = async (input) => {
  const { error } = validateAddInvoice(input.body);
  if (error) return error.details[0];
  if (input.body.method == "pay")
    input.body.quantity = -Math.abs(input.body.quantity);
  let newInvoice = new Invoice(input.body).populate("client", "_id name");
  return await newInvoice.save();
};

const getInvoicesForAdmin = async (input) => {
  let {
    startId = false,
    limit = 10,
    all = false,
    filter = "{}",
    sort = `{"_id": 1}`,
  } = input.query;

  startId = !startId || startId == "false" ? false : startId;

  startId =
    all || !startId ? {} : { _id: { $gt: mongoose.Types.ObjectId(startId) } };
  limit = all ? null : !isNaN(limit) ? parseInt(limit) : 10;

  // let aggr = [
  //   {
  //     $lookup: {
  //       from: "users",
  //       let: { id: "$client" },
  //       pipeline: [
  //         {
  //           $match: {
  //             $expr: {
  //               $eq: ["$_id", "$$id"],
  //             },
  //           },
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             name: 1,
  //           },
  //         },
  //       ],
  //       as: "client",
  //     },
  //   },

  //   {
  //     $unwind: {
  //       path: "$client",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   },

  //   // {
  //   //   $group: {
  //   //     _id: "$_id",
  //   //     name: { $first: "$name" },
  //   //     deliveryMethod: { $first: "$deliveryMethod" },

  //   //     orderships: { $push: "$orderships" },
  //   //     // invoices: { $push: "$invoices" },
  //   //   },
  //   // },

  //   // {
  //   //   $filter: {
  //   //     ...startId,
  //   //     // ...JSON.parse(filter),
  //   //     "client.type": "advertisment",
  //   //     // $or: [
  //   //     //   { type: "vendor" },
  //   //     //   { type: "productiveFamily" },
  //   //     //   { type: "advertisment" },
  //   //     // ],
  //   //   },
  //   // },
  //   // {
  //   //   $redact: {
  //   //     if: { $eq: ["$client.type", "vendor"] },
  //   //     then: "$$DESCEND",
  //   //     else: "$$PRUNE",
  //   //   },
  //   // },
  //   {
  //     $sort: {
  //       _id: 1,
  //     },
  //   },
  //   {
  //     $limit: limit ? limit : Infinity,
  //   },

  //   // {
  //   //   $project: {
  //   //     _id: 1,

  //   //     client: {
  //   //       $filter: {
  //   //         input: "$client",
  //   //         as: "order",
  //   //         cond: { $eq: ["$$order.type", "vendor"] },
  //   //       },
  //   //     },
  //   //     // invoices: 1,
  //   //   },
  //   // },
  // ];
  // let users = await Invoice.aggregate(aggr);
  // console.log("getInvoicesForAdmin -> users", users);

  let users = await Invoice.find({ ...startId })
    .populate("client", "_id name", {
      ...JSON.parse(filter),
    })
    .sort(sort)
    .limit(limit);

  return users.filter(function (user) {
    return user.client; // return only users with email matching 'type: "Gmail"' query
  });
};
const deleteInvoice = async (id) => {
  return await Invoice.deleteOne({ _id: id });
};

const updateInvoiceForAdmin = async (input) => {
  const { error } = validateEditInvoice(input.body);
  if (error) return error.details[0];

  let body = input.body,
    { id } = input.params;
  if (input.body.method == "pay" && input.body.quantity)
    input.body.quantity = -Math.abs(input.body.quantity);
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
