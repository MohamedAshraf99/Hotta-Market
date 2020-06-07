const Joi = require('joi');
const mongoose = require('mongoose');


const orderShipSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
        required: true,
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    shippingFees: {
        type: Number,
        required: true
    },
    profitCalcMethod : {
        type: String,
        enum: ['vendor','cat']
    },
    profitPercentage: {
        type: Number,
        required: true,
    },
    profitValue: {
        type: Number,
        required: true,
    },
    taxPercentage: {
        type: Number,
        required: true,
    },
    taxValue: {
        type: Number,
        required: true,
    },
    deliveryMethod: {
        type: String,
        enum: ['vendor','admin']
    },
    totalAdminBalance: {
        type: Number,
        required: true,
    },
    number: {
        type: String,
      },
    shipmentStatus : {
        type: String,
        default: "new",
        enum: ['new', 'completed','canceled','returned']
    },
    log: [{
        date: {
            type: Date,
            default: Date.now()
        },
        state: {
            type: String,
            default: "new",
            enum: ['new', 'progress','onWay','delivered', 'canceled','returned']
        }
    }],
    isNeglected: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const orderShip = mongoose.model('orderShip', orderShipSchema);

const validateAddOrderShip = (body) => {
    let schema = {
        shippingFees:Joi.number().required(),
        provider: Joi.string().length(24).required(),
        order: Joi.string().length(24).required(),
        shipItems: Joi.array().required(),
        log: Joi.array().optional(),
        completed: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}

const validateUpdateForAdmin = (body) => {
    let schema = {
        state:Joi.string().optional(),
        isNeglected:Joi.bool().optional(),
        completed:Joi.bool().optional(),
    };
  
    return Joi.validate(body, schema);
  }

  const updateOrderShipForAdmin = async (input) => {
  
    const { error } = validateUpdateForAdmin(input.body);
    if (error) return (error.details[0]);
  
    let body = input.body,
        {id} = input.params
  
    let state = body.state || false
  
  
    let updatedOrder = await orderShip.findByIdAndUpdate(
      id,
      {
        ...(state && {$push: {log: {state}}}),
        ..._.omit(body, ['state'])
      },
      { new: true }
    )
  
    return updatedOrder
  
  }

module.exports = {
    orderShip,
    validateAddOrderShip,
    updateOrderShipForAdmin
}


