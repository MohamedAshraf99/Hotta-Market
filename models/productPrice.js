const Joi = require("joi");
const mongoose = require("mongoose");

const productPriceSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  props: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductSubProp",
    },
  ],
  avatars: [
    {
      type: String,
      required: true,
    },
  ],
  price: {
    initialPrice: Number,
    reducedPrice: Number,
    reducedPriceFDate: Date,
    reducedPriceEDate: Date,
    quantity: {
      type: Number,
      default: 0,
    },
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

const ProductPrice = mongoose.model("ProductPrice", productPriceSchema);

const validateAdd = (body, beforeProduct) => {
  let schema = {
    product: Joi.string().length(24).required(),
    props: Joi.array().required(),
    avatars: Joi.array().required(),
    price: Joi.object().required(),
  };

  if (beforeProduct) schema.product = Joi.string().length(24).optional();

  return Joi.validate(body, schema);
};

const validateUpdate = (body) => {
  let schema = {
    isNeglected: Joi.bool().optional(),
    price: Joi.object().optional(),
    props: Joi.array().optional(),
    avatars: Joi.array().optional(),
  };
  return Joi.validate(body, schema);
};

const updateProductPrice = async (input) => {
  let { id } = input.params;
  let body = input.body;

  const { error } = validateUpdate(body);
  if (error) return error.details[0];

  let updateProductPrice = await ProductPrice.findByIdAndUpdate(id, body, {
    new: true,
  });

  return updateProductPrice;
};

const addProductPrice = async (input) => {
  let body = input.body;

  const { error } = validateAdd(body);
  if (error) return error.details[0];

  let newPP = await ProductPrice.create(body);

  return newPP;
};

module.exports = {
  ProductPrice,
  productPriceSchema,
  validateAdd,
  updateProductPrice,
  addProductPrice,
};
