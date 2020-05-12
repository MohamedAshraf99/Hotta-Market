const Joi = require('joi');
const mongoose = require('mongoose');
const {orderShip,validateAddOrderShip} = require('./orderShip');
const {shipItems,validateAddShipItems} = require('./shipItems');
const {PaymentTransaction,validateAddPaymentTransaction} = require('./paymentTransaction');

const orderSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    location: {
        area: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: true,
        },
        lat: String,
        lng: String,
        desc: String
    },
    number: {
        type: Number,
        unique: true,
      },
    log: [{
        date: {
            type: Date,
            default: Date.now()
        },
        state: {
            type: String,
            default: "new",
            enum: ['new', 'progress','complete', 'canceled']
        }
    }],
    isNeglected: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Order = mongoose.model('Order', orderSchema);

const validateAddOrder = (body) => {
    let schema = {
        client: Joi.string().length(24).required(),
        log: Joi.array().optional(),
        completed: Joi.bool().optional(),
        orderShip: Joi.array().required(),
        location: Joi.object().required(),
        price: Joi.number().required(),
        method: Joi.string().required(),
    };

    return Joi.validate(body, schema);
}

const addOrder = async (input) => {

    const { error } = validateAddOrder(input.body);
    if (error) return (error.details[0]);
    
    let client = input.body.client;
    let orderShips = input.body.orderShip || [{}];
    let location = input.body.location;
    let test = input.body.orderShip;
    let price = input.body.price;
    let method = input.body.method;
    let orderBody = {client:client,log:[{}],location:location};

    let maxNumber = await Order.findOne({}, { number: 1 }).sort({ number: -1 });
    if (maxNumber == null)
    maxNumber = 1 ;

    orderBody.number = maxNumber.number ? maxNumber.number + 1 : 1;

    let newOrder = new Order(orderBody);
    newOrder = await newOrder.save();

    if(newOrder._id) {
        let orderId = newOrder._id.toString();
    
        const { error } = validateAddPaymentTransaction({method:method,price:price,order:orderId});
        if (error) return (error.details[0]);
        let paymentTransaction = new PaymentTransaction({method:method,price:price,order:orderId});

        paymentTransaction = await paymentTransaction.save();
    orderShips = orderShips.map(pp=>({...pp, order: orderId,log:[{}]}))
    for (let i = 0; i < orderShips.length; i++) {
        const { error } = validateAddOrderShip(orderShips[i]);
        if (error) return (error.details[0]);
      }
      orderShips = await orderShip.create(orderShips);
      orderShipsId = orderShips.map(id=>{return id._id.toString()});
      if(orderShipsId) {
          let ship =[]
        for (let i = 0; i < test.length; i++) {
            for (let j = 0; j < test[i].shipItems.length; j++) {
                test[i].shipItems[j].orderShips = orderShipsId[i];
                const { error } = validateAddShipItems(test[i].shipItems[j]);
                if (error) return (error.details[0]);
                ship.push(test[i].shipItems[j]);
            }
        }
        ship = await shipItems.create(ship);


        return {
            paymentTransaction,
            test,
            ...newOrder.toObject()
          }
    }
 }
}

module.exports = {
    Order,
    addOrder
}
