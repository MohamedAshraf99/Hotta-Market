const Joi = require('joi');
const mongoose = require('mongoose');
const { ProductPrice, validateAdd: productPriceValidateAdd } = require('./productPrice')
const { AppSettings } = require('./appSettings')
const _ = require('lodash')

const productSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cat",
    required: true,
  }],
  nameAr: {
    type: String,
    required: true,
  },
  prepaireDurationType: {
    type: String,
    enum: ['day', 'hour']
  },
  prepaireDurationValue: {
    type: Number,
    min: .1,
  },
  nameEn: {
    type: String,
    required: true,
  },
  code: {
    type: Number,
    unique: true,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  advertisementCount: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String,
    required: true,
  },
  desc: String,
  available: {
    type: Boolean,
    default: true,
  },
  isNeglected: {
    type: Boolean,
    default: false
  },
  bestSelling: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  bestReviews: {
    type: Boolean,
    default: false
  },
  dateCreate: {
    type: Date,
    default: Date.now
  },
});


const Product = mongoose.model('Product', productSchema);



const validateAdd = (body) => {
  let schema = {
    provider: Joi.string().length(24).required(),
    cats: Joi.array().required(),
    nameAr: Joi.string().required(),
    nameEn: Joi.string().required(),
    code: Joi.number().required(),
    tax: Joi.number().optional(),
    desc: Joi.string().optional(),
    avatar: Joi.string().required(),
    available: Joi.bool().optional(),
    bestSelling: Joi.bool().optional(),
    trending: Joi.bool().optional(),
    bestReviews: Joi.bool().optional(),
    prepaireDurationType: Joi.string().optional(),
    prepaireDurationValue: Joi.number().optional(),
    productPrices: Joi.array().required(),
  };

  return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
  let schema = {
    provider: Joi.string().length(24).optional(),
    cats: Joi.array().optional(),
    nameAr: Joi.string().optional(),
    nameEn: Joi.string().optional(),
    code: Joi.number().optional(),
    tax: Joi.number().optional(),
    desc: Joi.string().optional(),
    avatar: Joi.string().optional(),
    available: Joi.bool().optional(),
    bestSelling: Joi.bool().optional(),
    trending: Joi.bool().optional(),
    bestReviews: Joi.bool().optional(),
    isNeglected: Joi.bool().optional(),
    prepaireDurationType: Joi.string().optional(),
    prepaireDurationValue: Joi.number().optional(),
  };

  return Joi.validate(body, schema);
}

const updateProducts = async (input) => {

  let {id} = input.params;
  let body = input.body;

  const { error } = validateUpdate(body);
  if (error) return (error.details[0]);

  let updatedProduct = await Product.findByIdAndUpdate(id, body, {new: true})

  return updatedProduct;
}

const advertisementCount = async (input) => {

  let {id} = input.params;

  let count = await Product.findOne({ _id: id })
  count.advertisementCount = count.advertisementCount+1;
  await count.save();

  return count;
}



const addProduct = async (input) => {

  const { error } = validateAdd(input.body);
  if (error) return (error.details[0]);

  let { body } = input,
    productPrices = body.productPrices,
    productBody = _.omit(body, ['productPrices']);

  for (let i = 0; i < productPrices.length; i++) {
    const { error } = productPriceValidateAdd(productPrices[i], true);
    if (error) return (error.details[0]);
  }

  let newProduct = new Product(productBody)

  newProduct = await newProduct.save();

  if (newProduct._id) {

    newProduct = await Product
      .findOne({ _id: newProduct._id })
      .populate('cats', 'nameAr nameEn')
      .populate('provider', '_id name')

    let productId = newProduct._id;

    productPrices = productPrices.map(pp => ({ ...pp, product: productId }))

    if (newProduct.avatar) newProduct.avatar = input.app.get('defaultAvatar')(input, 'host', newProduct.avatar)
    else newProduct.avatar = input.app.get('defaultAvatar')(input)

    productPrices = await ProductPrice.create(productPrices)

    if (productPrices) {

      productPrices = productPrices.map(pp => ({
        ...pp.toObject(),
        avatars: pp.toObject().avatars.map(av => input.app.get('defaultAvatar')(input, 'host', av))
      }))

      return {
        productPrices,
        ...newProduct.toObject()
      }
    }
  }

}


const updateProduct = async (input) => {

  let body = input.body,
    id = input.params.id

  const { error } = validateUpdate(body);
  if (error) return (error.details[0]);


  let updatedProduct = await Product.findByIdAndUpdate(
    id, body, { new: true }
  )

  if (updatedProduct.avatar)
    updatedProduct.avatar = input.app.get('defaultAvatar')(input, 'host') + updatedProduct.avatar
  else updatedProduct.avatar = input.app.get('defaultAvatar')(input)

  return updatedProduct;
}


const getProductForAdmin = async (input) => {

  let {id = ""} = input.params

  let product = await Product.aggregate([
    {
      '$match': {
        '_id': mongoose.Types.ObjectId(id)
      }
    }, {
      '$lookup': {
        'from': 'cats', 
        'localField': 'cats', 
        'foreignField': '_id', 
        'as': 'cats'
      }
    }, {
      '$lookup': {
        'from': 'productprices', 
        'localField': '_id', 
        'foreignField': 'product', 
        'as': 'productPrices'
      }
    }, {
      '$unwind': {
        'path': '$productPrices'
      }
    }, {
      '$lookup': {
        'from': 'productsubprops', 
        'localField': 'productPrices.props', 
        'foreignField': '_id', 
        'as': 'productPrices.props'
      }
    }, {
      '$unwind': {
        'path': '$productPrices.props',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'productmainprops', 
        'localField': 'productPrices.props.productMainProp', 
        'foreignField': '_id', 
        'as': 'productPrices.props.productMainProp'
      }
    }, {
      '$addFields': {
        'productPrices.props.productMainProp': {
          '$arrayElemAt': [
            '$productPrices.props.productMainProp', 0
          ]
        }
      }
    }, {
      '$lookup': {
        'from': 'users', 
        'localField': 'provider', 
        'foreignField': '_id', 
        'as': 'provider'
      }
    }, {
      '$addFields': {
        'provider': {
          '$arrayElemAt': [
            {
              '$map': {
                'input': '$provider', 
                'as': 'o', 
                'in': {
                  '_id': '$$o._id', 
                  'name': '$$o.name',
                  'type': '$$o.type',
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
          'productPrices': '$productPrices._id'
        }, 
        'doc': {
          '$first': '$$ROOT'
        }, 
        'props': {
          '$push': '$productPrices.props'
        }
      }
    }, {
      '$addFields': {
        'doc.productPrices.props': '$props'
      }
    }, {
      '$replaceRoot': {
        'newRoot': '$doc'
      }
    }, {
      '$sort': {
        'productPrices._id': 1
      }
    }, {
      '$group': {
        '_id': '$_id', 
        'doc': {
          '$first': '$$ROOT'
        }, 
        'productPrices': {
          '$push': '$productPrices'
        }
      }
    }, {
      '$addFields': {
        'doc.productPrices': '$productPrices'
      }
    }, {
      '$project': {
        'productPrices': 0
      }
    }, {
      '$replaceRoot': {
        'newRoot': '$doc'
      }
    }
  ])

  product = product.length? product[0]: {}

  if (product._id) {

    if (product.avatar) product.avatar = input.app.get('defaultAvatar')(input, 'host', product.avatar)
    else product.avatar = input.app.get('defaultAvatar')(input)


  let productPrices = product.productPrices.map(pp => {
    let avatars = pp.avatars;

    avatars = avatars.map(avatar => input.app.get('defaultAvatar')(input, 'host', avatar))

    return {...pp, avatars};
  });

  product.productPrices = productPrices

}

return product

}


const getProductsForAdmin = async (input) => {

  let { startId = false, limit = 10, all = false, sort=`{"_id":1}` } = input.query;

  startId = (!startId || startId == "false") ? false : startId

  startId = (all || !startId) ? {} : { '_id': { '$gt': mongoose.Types.ObjectId(startId) } };
  limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);

  sort = JSON.parse(sort)
  let sortField = Object.keys(sort)[0],
      sortValue = Object.values(sort)[0]

  let provider = {}

  if (input.query.provider) {
    if (input.query.provider == "false" || !input.query.provider) provider = {}
    else provider = { provider: mongoose.Types.ObjectId(input.query.provider) }
  }


  let type = Object.keys(provider).length ? {} :
    { "provider.type": input.query.type || "vendor" };
    
  let products = await Product.aggregate([
    {
      '$match': startId
    }, {
      '$match': {
        'isNeglected': false,
        ...provider
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'provider',
        'foreignField': '_id',
        'as': 'provider'
      }
    }, {
      '$addFields': {
        'provider': {
          '$map': {
            'input': '$provider',
            'as': 'p',
            'in': {
              'name': '$$p.name',
              'type': '$$p.type',
              'isNeglected': '$$p.isNeglected',
              '_id': '$$p._id'
            }
          }
        }
      }
    }, {
      '$addFields': {
        'provider': {
          '$arrayElemAt': [
            '$provider', 0
          ]
        }
      }
    }, {
      '$match': {
        ...type,
        'provider.isNeglected': false
      }
    }, {
      '$lookup': {
        'from': 'cats',
        'localField': 'cats',
        'foreignField': '_id',
        'as': 'cats'
      }
    }, {
      '$addFields': {
        'cats': {
          '$map': {
            'input': '$cats',
            'as': 'cat',
            'in': {
              'nameAr': '$$cat.nameAr',
              'nameEn': '$$cat.nameEn'
            }
          }
        }
      }
    }, {
      '$sort': {
          [sortField]: sortValue
      }
  },{
      '$limit': limit? limit: Infinity
  }
  ]);

  if (products.length)
    products = products.map(product => {
      if (product.avatar) product.avatar = input.app.get('defaultAvatar')(input, 'host', product.avatar)
      else product.avatar = input.app.get('defaultAvatar')(input)
      return product
    });

  return products
}


async function getProductDetails(input) {
  let startId = input.params.id;
  let userId = input.query.userId;
  let type = input.query.type;
  let filter = input.query.filter;
  if(filter == "true") {
    filter = {'_id': mongoose.Types.ObjectId(startId),
              'isNeglected': false,
              'available': true}
  }
  else {
    filter = {'_id': mongoose.Types.ObjectId(startId),
    'isNeglected': false,}
  }
  if (type == "advertisement") {
    let aggr = [
      {
        '$match': filter
      },
      {
        '$lookup': {
          'from': 'productprices',
          'localField': '_id',
          'foreignField': 'product',
          'as': 'productPrices'
        }
      },
      {
        '$unwind': {
          'path': '$productPrices',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$lookup': {
          'from': 'users',
          'localField': 'provider',
          'foreignField': '_id',
          'as': 'provider'
        }
      },
      {
        '$unwind': {
          'path': '$provider',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$group': {
          '_id': '$_id',
          'avatar': {
            '$first': '$avatar'
          },
          'nameAr': {
            '$first': '$nameAr'
          },
          'nameEn': {
            '$first': '$nameEn'
          },
          'phoneNumber': {
            '$first': '$provider.phone'
          },
          'description': {
            '$first': '$desc'
          },
          'price': {
            '$first': '$productPrices.prices'
          },
          'productPrices': {
            '$addToSet': '$productPrices'
          },
        }
      },
      {
        '$project': {
          '_id': 1,
          'avatar': 1,
          'nameAr': 1,
          'nameEn': 1,
          'description': 1,
          'phoneNumber': 1,
          'productPrices': 1,
          'price.initialPrice': 1,
        }
      },

    ];
    let getProducts = await Product.aggregate(aggr);
    if (getProducts.length != 0) {
      getProducts[0].avatar = input.app.get('defaultAvatar')(input, 'host') + getProducts[0].avatar;
    }
    return (getProducts);
  }
  else {
    let appSettings = await AppSettings.findOne();
    let generalTax = appSettings.generalTax;
    let aggr = [
      {
        '$match': filter
      },
      {
        '$lookup': {
          'from': 'productprices',
          'localField': '_id',
          'foreignField': 'product',
          'as': 'productPrices'
        }
      },
      {
        '$unwind': {
          'path': '$productPrices',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$lookup': {
          'from': 'productsubprops',
          'localField': 'productPrices.props',
          'foreignField': '_id',
          'as': 'productPrices.productSubProps'
        }
      },
      {
        '$lookup': {
          'from': 'productmainprops',
          'localField': 'productPrices.productSubProps.productMainProp',
          'foreignField': '_id',
          'as': 'productPrices.productMainProp'
        }
      },
      {
        '$lookup': {
          'from': 'users',
          'localField': 'provider',
          'foreignField': '_id',
          'as': 'provider'
        }
      },
      {
        '$unwind': {
          'path': '$provider',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$lookup': {
          'from': 'shipitems',
          'localField': 'productPrices._id',
          'foreignField': 'product.productPrice',
          'as': 'shipItems'
        }
      },
      {
        '$unwind': {
          'path': '$shipItems',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$lookup': {
          'from': 'favouriteproducts',
          'localField': '_id',
          'foreignField': 'product',
          'as': 'favouriteProducts'
        }
      },
      {
        '$unwind': {
          'path': '$favouriteProducts',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$lookup': {
          'from': 'shipcards',
          'localField': 'productPrices._id',
          'foreignField': 'productPrice',
          'as': 'shipCards'
        }
      },
      {
        '$unwind': {
          'path': '$shipCards',
          'preserveNullAndEmptyArrays': true
        }
      },
      {
        '$addFields': {
          'favourite': {
            '$and': [{ '$eq': ["$favouriteProducts.user", mongoose.Types.ObjectId(userId)] }, { '$eq': ["$favouriteProducts.product", "$_id"] }]
          }
        }
      },
      {
        '$addFields': {
          'cart': {
            '$and': [{ '$eq': ["$shipCards.client", mongoose.Types.ObjectId(userId)] }, { '$eq': ["$productPrices._id", "$shipCards.productPrice"] }]
          },
          'generalTax':generalTax
        }
      },
      {
        '$group': {
          '_id': '$_id',
          'avatar': {
            '$first': '$avatar'
          },
          'nameAr': {
            '$first': '$nameAr'
          },
          'tax': {
            '$first': '$tax'
          },
          'generalTax': {
            '$first': '$generalTax'
          },
          'prepaireDurationValue': {
            '$first': '$prepaireDurationValue'
          },
          'prepaireDurationType': {
            '$first': '$prepaireDurationType'
          },
          'nameEn': {
            '$first': '$nameEn'
          },
          'available': {
            '$first': '$available'
          },
          'shopName': {
            '$first': '$provider.commercialName'
          },
          'openingTime': {
            '$first': '$provider.openingTime'
          },
          'closingTime': {
            '$first': '$provider.closingTime'
          },
          'description': {
            '$first': '$desc'
          },
          'price': {
            '$first': '$productPrices.price'
          },
          'productPrices': {
            '$addToSet': '$productPrices'
          },
          'favourite': {
            '$first': '$favourite'
          },
          'cart': {
            '$first': '$cart'
          },
          'totalRates': { '$addToSet': '$shipItems.rate.rate' },
          'rate': {
            '$avg': "$shipItems.rate.rate"
          },
        }
      },
      {
        '$project': {
          '_id': 1,
          'avatar': 1,
          'tax': 1,
          'generalTax':1,
          'nameAr': 1,
          'nameEn': 1,
          'available': 1,
          'prepaireDurationValue': 1,
          'prepaireDurationType': 1,
          'shopName': 1,
          'openingTime': 1,
          'closingTime': 1,
          'description': 1,
          'productPrices': 1,
          'price.initialPrice': 1,
          'price.reducedPrice': { "$ifNull": [ "$price.reducedPrice", "$price.initialPrice" ] },
          'favourite': 1,
          'cart': 1,
          'totalRates': 1,
          'rate': 1,
        }
      },
      {
        '$addFields': {
          'discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$price.initialPrice","$price.reducedPrice"] }, '$price.initialPrice' ]}]},
        }
      },

    ];
    
    let getProducts = await Product.aggregate(aggr);
    if (getProducts.length != 0) {
      getProducts[0].totalRates = getProducts[0].totalRates.length;
      getProducts[0].avatar = input.app.get('defaultAvatar')(input, 'host') + getProducts[0].avatar;
      getProducts[0].productPrices.map(product=>{
        if(!product.price.reducedPrice) {
          product.price.reducedPrice = product.price.initialPrice;
        }
        product.price.discountPrecentage = ((product.price.initialPrice - product.price.reducedPrice)/product.price.initialPrice)*100;
        return product;
      })
    }
    return (getProducts);
  }

}


module.exports = {
  Product,
  addProduct,
  updateProduct,
  getProductDetails,
  getProductsForAdmin,
  getProductForAdmin,
  updateProducts,
  advertisementCount
}












//transaction guaranted 
// const session = await mongoose.startSession()
// session.startTransaction()
// try {
//start code

// newProduct = await Product.insertMany([_.omit(body, ['productPrices'])], {session})
// newProduct = await newProduct.save({session})

// if (newProduct._id) {
//     productPricesArr = productPricesArr
//         .map(pp => ({ ...pp, product: newProduct._id }));

//         // throw new Error("message");

//     productPricesArr = await ProductPrice
//         .insertMany(productPricesArr, { session });

//     newProduct.productPrices = productPricesArr;
// }

//start end
// await session.commitTransaction()
// session.endSession()
// } catch (err) {
// console.log(err);
// await session.abortTransaction()
// session.endSession()
// }
//end transaction

