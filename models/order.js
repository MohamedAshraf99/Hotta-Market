const Joi = require('joi');
const mongoose = require('mongoose');
const {orderShip,validateAddOrderShip} = require('./orderShip');
const {shipItems,validateAddShipItems} = require('./shipItems');
const {ShipCard} = require('./shipCard');
const { AppSettings } = require('./appSettings')
const {PaymentTransaction,validateAddPaymentTransaction} = require('./paymentTransaction');
const {User} = require('./user');
const _ = require("lodash")

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
            default: Date.now
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
}

const validateUpdateOrderForAdmin = (body) => {
  let schema = {
      state:Joi.string().optional(),
      isNeglected:Joi.bool().optional(),
      completed:Joi.bool().optional(),
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

const updateOrderForAdmin = async (input) => {

  const { error } = validateUpdateOrderForAdmin(input.body);
  if (error) return (error.details[0]);

  let body = input.body,
      {id} = input.params

  let state = body.state || false


  let updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      ...(state && {$push: {log: {state}}}),
      ..._.omit(body, ['state'])
    },
    { new: true }
  )

  return _.omit(updatedOrder.toObject(), ['client', 'location'])

}


async function getOrders(input) {
    let userId = input.params.id;
    let { startId = false, limit = 10, all = false } = input.query;

    startId = (!startId || startId == "false") ? false : startId

    startId = (all || !startId) ? {} : { '_id._id': { '$gt': mongoose.Types.ObjectId(startId) } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);


    let aggr = [
        {
          '$match': {
            '_id': mongoose.Types.ObjectId(userId),
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
           {
            '$match': startId
          },
           {
            '$sort': {
                '_id._id': 1
            }
        },
        {
            '$limit': limit? limit: Infinity
        }
           
      ];
      let getOrders = await User.aggregate(aggr);
     
      if (getOrders.length == 0 || (Object.keys(getOrders[0]._id).length === 0 && getOrders[0]._id.constructor === Object)  )
      {
        return getOrders = [];
      }
      else{
        return getOrders;
      }
      
  }

  async function getAllNumbers(input) {
    return await Order.find({},{ _id: 1, number: 1 })
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
                  'location.shippingFees': "$cities.shippingFees",
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
  

  let provider = (input.query.provider && input.query.provider != "false") ?
    { "providers.provider": mongoose.Types.ObjectId(input.query.provider) } : {},

    client = (input.query.client && input.query.client != "false") ?
      { "client._id": mongoose.Types.ObjectId(input.query.client) } : {},

    area = (input.query.area && input.query.area != "false") ?
      { "location.areaId": mongoose.Types.ObjectId(input.query.area) } : {},

    state = (input.query.state && input.query.state != "false") ?
      { "log.state": input.query.state } : {},

    startDate = (input.query.startDate && input.query.startDate != "false") ?
      { "dateCreate": { "$gte": new Date(parseInt(input.query.startDate)) } } : {},

    endDate = (input.query.endDate && input.query.endDate != "false") ?
      { "dateCreate": { "$lte": new Date(parseInt(input.query.endDate)) } } : {}

      
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
      '$match': {
        ...provider,
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
        ...client,
        ...area,
        ...state,
        ...startDate,
        ...endDate
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


const getOrderDetailsForAdmin = async (input) => {

  let { id="" } = input.params;

  let order = await Order.aggregate([
    {
      '$match': {
        '_id': mongoose.Types.ObjectId(id)
      }
    }, {
      '$lookup': {
        'from': 'appsettings', 
        'pipeline': [
          {
            '$match': {}
          }
        ], 
        'as': 'appSettings'
      }
    }, {
      '$addFields': {
        'appSettings': {
          '$arrayElemAt': [
            '$appSettings', -1
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'paymenttransactions', 
        'localField': '_id', 
        'foreignField': 'order', 
        'as': 'paymentTransactions'
      }
    }, {
      '$addFields': {
        'paymentTransactions': {
          '$arrayElemAt': [
            '$paymentTransactions', 0
          ]
        }
      }
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
            {
              '$map': {
                'input': '$location.area', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  'nameAr': '$$o.nameAr', 
                  'nameEn': '$$o.nameEn', 
                  'city': '$$o.city'
                }
              }
            }, 0
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
            {
              '$map': {
                'input': '$location.area.city', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  'nameAr': '$$o.nameAr', 
                  'nameEn': '$$o.nameEn', 
                  'shippingFees': '$$o.shippingFees', 
                  'country': '$$o.country'
                }
              }
            }, 0
          ]
        }
      }
    }, {
      '$lookup': {
        from: 'countries',
        localField: 'location.area.city.country',
        foreignField: '_id',
        as: 'location.area.city.country'
      }
    }, {
      '$addFields': {
        'location.area.city.country': {
          '$arrayElemAt': [
            {
          '$map': {
            'input': '$location.area.city.country', 
            'as': 'o', 
            'in': {
              '_id': '$$o._id',
              'nameAr': '$$o.nameAr',
              'nameEn': '$$o.nameEn',
            }
          }
        }
        
        ,0]
        }
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'localField': 'client', 
        'foreignField': '_id', 
        'as': 'client'
      }
    }, {
      '$addFields': {
        'client': {
          '$arrayElemAt': [
            {
              '$map': {
                'input': '$client', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  'name': '$$o.name'
                }
              }
            }, 0
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'orderships', 
        'localField': '_id', 
        'foreignField': 'order', 
        'as': 'orderShips'
      }
    }, {
      '$unwind': {
        'path': '$orderShips', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'localField': 'orderShips.provider', 
        'foreignField': '_id', 
        'as': 'orderShips.provider'
      }
    }, {
      '$addFields': {
        'orderShips.provider': {
          '$arrayElemAt': [
            {
              '$map': {
                'input': '$orderShips.provider', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  'name': '$$o.name'
                }
              }
            }, 0
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'shipitems', 
        'localField': 'orderShips._id', 
        'foreignField': 'orderShips', 
        'as': 'orderShips.shipItems'
      }
    }, {
      '$unwind': {
        'path': '$orderShips.shipItems', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'productprices', 
        'localField': 'orderShips.shipItems.product.productPrice', 
        'foreignField': '_id', 
        'as': 'orderShips.shipItems.product.productPrice'
      }
    }, {
      '$addFields': {
        'orderShips.shipItems.product.productPrice': {
          '$arrayElemAt': [
            {
              '$map': {
                'input': '$orderShips.shipItems.product.productPrice', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  // 'price': '$$o.price', 
                  'product': '$$o.product'
                }
              }
            }, 0
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'products', 
        'localField': 'orderShips.shipItems.product.productPrice.product', 
        'foreignField': '_id', 
        'as': 'orderShips.shipItems.product.productPrice.product'
      }
    }, {
      '$addFields': {
        'orderShips.shipItems.product.productPrice.product': {
          '$arrayElemAt': [
            {
              '$map': {
                'input': '$orderShips.shipItems.product.productPrice.product', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  'nameEn': '$$o.nameEn', 
                  'nameAr': '$$o.nameAr', 
                  'tax': '$$o.tax'
                }
              }
            }, 0
          ]
        }
      }
    }, {
      '$group': {
        '_id': {
          '_id': '$_id', 
          'orderShipsId': '$orderShips._id'
        }, 
        'doc': {
          '$first': '$$ROOT'
        }, 
        'orderItems': {
          '$push': '$orderShips.shipItems'
        }
      }
    }, {
      '$addFields': {
        'doc.orderShips.shipItems': '$orderItems'
      }
    }, {
      '$replaceRoot': {
        'newRoot': '$doc'
      }
    }, {
      '$group': {
        '_id': '$_id', 
        'doc': {
          '$first': '$$ROOT'
        }, 
        'orderShips': {
          '$push': '$orderShips'
        }
      }
    }, {
      '$addFields': {
        'doc.orderShips': '$orderShips'
      }
    }, {
      '$project': {
        'orderShips': 0
      }
    }, {
      '$replaceRoot': {
        'newRoot': '$doc'
      }
    }
  ]);

  
  
  return order.length? order[0]: {}
}

module.exports = {
    Order,
    addOrder,
    updateOrderForAdmin,
    getOrders,
    getOrderDetails,
    getOrderDetailsForAdmin,
    getAllNumbers,
    updateOrder,
    getOrdersForAdmin
}
