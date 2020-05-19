const Joi = require('joi');
const mongoose = require('mongoose');
const {orderShip,validateAddOrderShip} = require('./orderShip');
const {shipItems,validateAddShipItems} = require('./shipItems');
const {ShipCard} = require('./shipCard');
const { AppSettings } = require('./appSettings')
const {PaymentTransaction,validateAddPaymentTransaction} = require('./paymentTransaction');
const {User} = require('./user');

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

const validateUpdate = (body) => {
  let schema = {
      date:Joi.date().required(),
      state:Joi.string().required()
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
    await ShipCard.findOneAndDelete({client: client})
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


async function getOrders(input) {
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
              'from': 'orders', 
              'localField': '_id', 
              'foreignField': 'client', 
              'as': 'orders'
            }
        },
        {
            '$unwind': {
              'path': '$orders',
              'preserveNullAndEmptyArrays': true
            }
          },
            {
            '$lookup': {
              'from': 'paymenttransactions', 
              'localField': 'orders._id', 
              'foreignField': 'order', 
              'as': 'paymentTransactions'
            }
        },
        {
            '$unwind': {
              'path': '$paymentTransactions',
              'preserveNullAndEmptyArrays': true
            }
          },
        {
            '$addFields': {
              'orders.price': "$paymentTransactions.price",
              'orders.log':{'$arrayElemAt': [ "$orders.log", -1 ]}
            }
          },
            {
              '$group': {
               '_id': '$orders',
               }
           },
           {
            '$project': {
                '_id._id': 1,
                '_id.number': 1,
                '_id.log.state': 1,
                '_id.dateCreate': 1,
                '_id.price': 1,
            }
           }, 
           
      ];
      let getOrders = await User.aggregate(aggr);
      if (Object.keys(getOrders[0]._id).length === 0 && getOrders[0]._id.constructor === Object)
      {
        return getOrders = [];
      }
      else{
        return getOrders;
      }
      
  }


  async function getOrderDetails(input) {
    let startId = input.params.id;
    let appSettings = await AppSettings.findOne();
    let generalTax = appSettings.generalTax;
        let aggr = [
            {
              '$match': {
                '_id': mongoose.Types.ObjectId(startId),
                'isNeglected': false,
              }
            },
                {
                '$lookup': {
                  'from': 'paymenttransactions', 
                  'localField': '_id', 
                  'foreignField': 'order', 
                  'as': 'paymentTransactions'
                }
            },
            {
                '$unwind': {
                  'path': '$paymentTransactions',
                  'preserveNullAndEmptyArrays': true
                }
              },
              {
                '$lookup': {
                  'from': 'areas', 
                  'localField': 'location.area', 
                  'foreignField': '_id', 
                  'as': 'area'
                }
            },
            {
                '$unwind': {
                  'path': '$area',
                  'preserveNullAndEmptyArrays': true
                }
              },
              {
                '$lookup': {
                  'from': 'cities', 
                  'localField': 'area.city', 
                  'foreignField': '_id', 
                  'as': 'cities'
                }
            },
            {
                '$unwind': {
                  'path': '$cities',
                  'preserveNullAndEmptyArrays': true
                }
              },
             
              {
                '$lookup': {
                  'from': 'orderships', 
                  'localField': '_id', 
                  'foreignField': 'order', 
                  'as': 'orderships'
                }
            },
            {
                '$unwind': {
                  'path': '$orderships',
                  'preserveNullAndEmptyArrays': true
                }
              },
              {
                '$lookup': {
                  'from': 'shipitems', 
                  'localField': 'orderships._id', 
                  'foreignField': 'orderShips', 
                  'as': 'shipitems'
                }
            },
            {
                '$unwind': {
                  'path': '$shipitems',
                  'preserveNullAndEmptyArrays': true
                }
              },
              {
                '$lookup': {
                  'from': 'productprices', 
                  'localField': 'shipitems.product.productPrice', 
                  'foreignField': '_id', 
                  'as': 'productprices'
                }
            },
            {
                '$unwind': {
                  'path': '$productprices',
                  'preserveNullAndEmptyArrays': true
                }
              },
              {
                '$lookup': {
                  'from': 'products', 
                  'localField': 'productprices.product', 
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
                '$lookup': {
                  'from': 'users', 
                  'localField': 'orderships.provider', 
                  'foreignField': '_id', 
                  'as': 'users'
                }
            },
            {
                '$unwind': {
                  'path': '$users',
                  'preserveNullAndEmptyArrays': true
                }
              },
            {
                '$addFields': {
                  'location.cityAr': "$cities.nameAr",
                  'location.cityEn': "$cities.nameEn",
                  'location.areaAr': "$area.nameAr",
                  'location.areaEn': "$area.nameEn",
                  'price': "$paymentTransactions.price",
                  'orderState':{'$arrayElemAt': [ "$log.state", -1 ]},
                  'shipitems.product.nameAr': "$products.nameAr",
                  'shipitems.product.tax': "$products.tax",
                  'shipitems.product.generalTax': generalTax,
                  'shipitems.product.nameEn': "$products.nameEn",
                  'shipitems.product.avatar': "$products.avatar",
                  'shipitems.product.prepaireDurationType': "$products.prepaireDurationType",
                  'shipitems.product.prepaireDurationValue': "$products.prepaireDurationValue",
                  'shipitems.product.provider': "$orderships.provider",
                  'shipitems.product.providerName': "$users.commercialName",
                  'shipitems.product.providerState': {'$arrayElemAt': [ "$orderships.log.state", -1 ]},
                }
              },
                {
                  '$group': {
                   '_id': '$shipitems.product.provider',
                   'shipitems': {
                    '$addToSet': '$shipitems.product'
                    },
                    'number': {
                        '$first': '$number'
                    },
                    'state': {
                        '$first': '$orderState'
                    },
                    'dateCreate': {
                        '$first': '$dateCreate'
                    },
                    'price': {
                        '$first': '$price'
                    },
                    'location': {
                        '$first': '$location'
                    },
                    'paymentMethod': {
                      '$first': '$paymentTransactions.method'
                    },
                   }
               },
               {
                '$project': {
                    '_id': 1,
                    'shipitems': 1,
                    'number': 1,
                    'dateCreate': 1,
                    'state': 1,
                    'price':1,
                    'location':1,
                    'paymentMethod': 1,
                }
               }, 
               
          ];
          let getOrder = await Order.aggregate(aggr);
          if(getOrder)
            {
              let ship = [];
               getOrder.map(order=>{
                 ship.push({state:order.shipitems[0].providerState,provider:order._id,providerName:order.shipitems[0].providerName,shipItem:order.shipitems})
                 order.shipitems.map(item=>{
                  item.avatar = input.app.get('defaultAvatar')(input, 'host') + item.avatar;
                  item.totalPrice = item.quantity * item.price;
                  return item
                 })
               })
               getOrder[0].shipitems = ship;
               return (getOrder[0]);
           }
  }

  const updateOrder = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $addToSet: {log:body} },
      { new: true }
  );

    return updatedOrder;
}


const getOrdersForAdmin = async (input) => {

  let { startId = false, limit = 10, all = false } = input.query;

  startId = (!startId || startId == "false") ? false : startId

  startId = (all || !startId) ? {} : { '_id': { '$gt': mongoose.Types.ObjectId(startId) } };
  limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);


    let provider = (input.query.provider)?
    (
      (input.query.provider == "false" || !input.query.provider)? {}:
      {"provider._id": mongoose.Types.ObjectId(input.query.provider)}
    ): {}

    let client = (input.query.client)?
    (
      (input.query.client == "false" || !input.query.client)? {}:
      {"client._id": mongoose.Types.ObjectId(input.query.client)}
    ): {}

    let area = (input.query.area)?
    (
      (input.query.area == "false" || !input.query.area)? {}:
      {"location.areaId": mongoose.Types.ObjectId(input.query.area)}
    ): {}

    let state = (input.query.state)?
    (
      (input.query.state == "false" || !input.query.state)? {}:
      {"log.state": input.query.state}
    ): {}
    

    
  let orders = await Order.aggregate([
    {
      '$match': startId
    }, {
      '$lookup': {
        'from': 'areas', 
        'localField': 'location.area', 
        'foreignField': '_id', 
        'as': 'location.area'
      }
    }, {
      '$addFields': {
        'location.area': {
          '$arrayElemAt': [
            '$location.area', 0
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'cities', 
        'localField': 'location.area.city', 
        'foreignField': '_id', 
        'as': 'location.area.city'
      }
    }, {
      '$addFields': {
        'location.area.city': {
          '$arrayElemAt': [
            '$location.area.city', 0
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'countries', 
        'localField': 'location.area.city.country', 
        'foreignField': '_id', 
        'as': 'location.area.city.country'
      }
    }, {
      '$addFields': {
        'location.area.city.country': {
          '$arrayElemAt': [
            '$location.area.city.country', 0
          ]
        }
      }
    }, {
      '$addFields': {
        'log': {
          '$arrayElemAt': [
            '$log', -1
          ]
        }, 
        'location': {
          'area': '$location.area.nameEn', 
          'city': '$location.area.city.nameEn', 
          'country': '$location.area.city.country.nameEn', 
          'areaId': '$location.area._id'
        }
      }
    }, {
      '$lookup': {
        'from': 'orderships', 
        'localField': '_id', 
        'foreignField': 'order', 
        'as': 'providers'
      }
    }, {
      '$addFields': {
        'providers': {
          '$map': {
            'input': '$providers', 
            'as': 'p', 
            'in': {
              'provider': '$$p.provider'
            }
          }
        }
      }
    }, {
      '$unwind': {
        'path': '$providers'
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'let': {
          'provider': '$providers.provider'
        }, 
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$_id', '$$provider'
                ]
              }
            }
          }, {
            '$project': {
              'name': 1
            }
          }
        ], 
        'as': 'providers'
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'let': {
          'client': '$client'
        }, 
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$eq': [
                  '$_id', '$$client'
                ]
              }
            }
          }, {
            '$project': {
              'name': 1
            }
          }
        ], 
        'as': 'client'
      }
    }, {
      '$addFields': {
        'providers': {
          '$arrayElemAt': [
            '$providers', 0
          ]
        }, 
        'client': {
          '$arrayElemAt': [
            '$client', 0
          ]
        }
      }
    }, {
      '$group': {
        '_id': '$_id', 
        'doc': {
          '$first': '$$ROOT'
        }, 
        'providers': {
          '$push': '$providers'
        }
      }
    }, {
      '$addFields': {
        'doc.providers': '$providers'
      }
    }, {
      '$replaceRoot': {
        'newRoot': '$doc'
      }
    }, {
      '$match': {
        // 'isNeglected': false,
        ...provider,
        ...client,
        ...area,
        ...state,
      }
    }, {
      '$sort': {
          _id: 1
      }
  },{
      '$limit': limit? limit: Infinity
  }
  ]);
  
  return orders
}


module.exports = {
    Order,
    addOrder,
    getOrders,
    getOrderDetails,
    updateOrder,
    getOrdersForAdmin
}
