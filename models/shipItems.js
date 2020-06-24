const Joi = require('joi');
const mongoose = require('mongoose');
const { Product } = require('../models/product');
const { AppSettings } = require('./appSettings')
const shipItemsSchema = new mongoose.Schema({
    orderShips: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderShips",
        required: true,
    },
    product: {
        productPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productPrice",
        required: true
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        total: {
          type: Number,
          required: true,
      },
        reducedPrice: {
          type: Number,
          required: true,
      },
        discountPrecentage: {
          type: Number,
          required: true,
      },
    },  
  dtlsProfitPercentage: {
    type: Number,
    required: true,
  },
  dtlsProfitValue: {
    type: Number,
    required: true,
  },
  adminBalance: {
    type: Number,
    required: true,
  },
    requiredDateTime: Date,
    rate:{
        positive: {
            type: String,
        },
        negative: {
            type: String,
        },
        rate:{
            type: Number,
        }
    },
    isNeglected: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const shipItems = mongoose.model('shipItems', shipItemsSchema);
const validateAddShipItems = (body) => {
    let schema = {
        dtlsProfitPercentage:Joi.number().required(),
        dtlsProfitValue:Joi.number().required(),
        adminBalance:Joi.number().required(),
        orderShips: Joi.string().length(24).required(),
        requiredDateTime: Joi.date().required(),
        rate: Joi.object().optional(),
        product: Joi.object().required(),
    };

    return Joi.validate(body, schema);
}



async function getBestSelling(input) {
    let userId = input.query.userId;
    let appSettings = await AppSettings.findOne();
    let maxLimit = appSettings.maxLimit;
    let productMethod = appSettings.productMethod;
    if(productMethod == "manual")
    {
      let agg = [
        {
          '$match': {
            'isNeglected': false,
            'available': true,
            'bestReviews': true
          }
        },
            {
            '$lookup': {
              'from': 'productprices', 
              'localField': '_id', 
              'foreignField': 'product', 
              'as': 'ProductPrices'
            }
        },
        {
            '$unwind': {
              'path': '$ProductPrices',
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
              'localField': 'ProductPrices._id', 
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
            '$lookup': {
              'from': 'shipitems', 
              'localField': 'ProductPrices._id', 
              'foreignField': 'product.productPrice', 
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
            '$addFields': {
                'favourite': {
                    '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$_id" ] } ]
                }
            }
        },
        {
            '$addFields': {
                'cart': {
                    '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$ProductPrices._id", "$shipCards.productPrice" ] } ]
                },
                'productPrices':'$ProductPrices._id'
            }
        },
            {
              '$group': {
              '_id': '$_id',
              'count': { '$sum': 1 },
              'avatar': {
              '$first': '$avatar'
              },
              'nameAr': {
                '$first': '$nameAr'
              },
              'nameEn': {
                '$first': '$nameEn'
              },
              'productPrices': {
                  '$first': '$productPrices'
              },
              'bestReviews': {
                '$first': '$bestReviews'
              },
              'available': {
                '$first': '$available'
              },
              'favourite': {
                '$first': '$favourite'
              },
              'cart': {
                '$first': '$cart'
              },
              'price': {
                '$first': '$ProductPrices.price'
              },
               }
           },
           {
            '$project': {
                '_id': 1,
                'avatar': 1,
                'productPrices': 1,
                'nameAr': 1,
                'nameEn': 1,
                'bestReviews': 1,
                'available': 1,
                'price.initialPrice': 1,
                'price.reducedPrice': { "$ifNull": [ "$price.reducedPrice", "$price.initialPrice" ] },
                'favourite': 1,
                'cart': 1,
                'count': 1,
            }
           }, 
           {
            '$addFields': {
              'discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$price.initialPrice","$price.reducedPrice"] }, '$price.initialPrice' ]}]},
            }
          },
          { '$sort' : { 'count' : -1} },
          { '$limit' : maxLimit }
       ];
      let Products = await Product.aggregate(agg);
      if(Products.length != 0)
        {
          Products = Products.map(product=>{
              product.avatar = input.app.get('defaultAvatar')(input, 'host') + product.avatar;
              return product = {'_id':product,count:product.count};
          })
       }
      return Products;
    }
    else{
    let aggr = [
        {
          '$match': {
            'isNeglected': false,
          }
        },
            {
            '$lookup': {
              'from': 'productprices', 
              'localField': 'product.productPrice', 
              'foreignField': '_id', 
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
              'from': 'products', 
              'localField': 'productPrices.product', 
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
            '$match': {
              'products.available': true,
              'products.isNeglected': false,
            }
          },
          {
            '$lookup': {
              'from': 'favouriteproducts', 
              'localField': 'products._id', 
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
                'products.favourite': {
                    '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$products._id" ] } ]
                }
            }
        },
        {
            '$addFields': {
                'products.cart': {
                    '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$productPrices._id", "$shipCards.productPrice" ] } ]
                },
                'products.productPrices':'$productPrices._id'
            }
        },
            {
              '$group': {
               '_id': '$products',
               'count': { '$sum': 1 },
                'productPrices': {
                    '$first': '$productPrices'
                },
               }
           },
           {
            '$addFields': {
              '_id.price': "$productPrices.price",
            }
          },
           {
            '$project': {
                '_id._id': 1,
                '_id.avatar': 1,
                '_id.productPrices': 1,
                '_id.nameAr': 1,
                '_id.available': 1,
                '_id.nameEn': 1,
                '_id.price.initialPrice': 1,
                '_id.price.reducedPrice': { "$ifNull": [ "$_id.price.reducedPrice", "$_id.price.initialPrice" ] },
                '_id.favourite': 1,
                '_id.cart': 1,
                'count': 1,
            }
           }, 
           {
            '$addFields': {
              '_id.discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$_id.price.initialPrice","$_id.price.reducedPrice"] }, '$_id.price.initialPrice' ]}]},
            }
          },
           { '$sort' : { 'count' : -1} },
           { '$limit' : maxLimit }
      ];
      let getProducts = await shipItems.aggregate(aggr);
      if(getProducts.length != 0)
      {
        getProducts = getProducts.map(product=>{
            product._id.avatar = input.app.get('defaultAvatar')(input, 'host') + product._id.avatar;
            return product;
        })
     }
      return (getProducts);
    }
  }


  async function getTrending(input) {
    let userId = input.query.userId;
    let appSettings = await AppSettings.findOne();
    let maxLimit = appSettings.maxLimit;
    let productMethod = appSettings.productMethod;
    let currentDate = new Date();
    let lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    if(productMethod == "manual")
    {
      let agg = [
        {
          '$match': {
            'isNeglected': false,
            'available': true,
            'bestReviews': true
          }
        },
            {
            '$lookup': {
              'from': 'productprices', 
              'localField': '_id', 
              'foreignField': 'product', 
              'as': 'ProductPrices'
            }
        },
        {
            '$unwind': {
              'path': '$ProductPrices',
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
              'localField': 'ProductPrices._id', 
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
            '$lookup': {
              'from': 'shipitems', 
              'localField': 'ProductPrices._id', 
              'foreignField': 'product.productPrice', 
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
            '$match': {
              'shipitems.isNeglected': false,
              'shipitems.dateCreate': {'$gte': lastMonth, '$lte': currentDate}
            }
          },
          {
            '$addFields': {
                'favourite': {
                    '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$_id" ] } ]
                }
            }
        },
        {
            '$addFields': {
                'cart': {
                    '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$ProductPrices._id", "$shipCards.productPrice" ] } ]
                },
                'productPrices':'$ProductPrices._id'
            }
        },
            {
              '$group': {
              '_id': '$_id',
              'count': { '$sum': 1 },
              'avatar': {
              '$first': '$avatar'
              },
              'nameAr': {
                '$first': '$nameAr'
              },
              'nameEn': {
                '$first': '$nameEn'
              },
              'productPrices': {
                  '$first': '$productPrices'
              },
              'bestReviews': {
                '$first': '$bestReviews'
              },
              'available': {
                '$first': '$available'
              },
              'favourite': {
                '$first': '$favourite'
              },
              'cart': {
                '$first': '$cart'
              },
              'price': {
                '$first': '$ProductPrices.price'
              },
               }
           },
           {
            '$project': {
                '_id': 1,
                'avatar': 1,
                'productPrices': 1,
                'nameAr': 1,
                'nameEn': 1,
                'bestReviews': 1,
                'available': 1,
                'price.initialPrice': 1,
                'price.reducedPrice': { "$ifNull": [ "$price.reducedPrice", "$price.initialPrice" ] },
                'favourite': 1,
                'cart': 1,
                'count': 1,
            }
           }, 
           {
            '$addFields': {
              'discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$price.initialPrice","$price.reducedPrice"] }, '$price.initialPrice' ]}]},
            }
          },
          { '$sort' : { 'count' : -1} },
          { '$limit' : maxLimit }
       ];
      let Products = await Product.aggregate(agg);
      if(Products.length != 0)
        {
          Products = Products.map(product=>{
              product.avatar = input.app.get('defaultAvatar')(input, 'host') + product.avatar;
              return product = {'_id':product,count:product.count};
          })
       }
      return Products;
    }
    else{
    let aggr = [
        {
          '$match': {
            'isNeglected': false,
            'dateCreate': {'$gte': lastMonth, '$lte': currentDate}
          }
        },
            {
            '$lookup': {
              'from': 'productprices', 
              'localField': 'product.productPrice', 
              'foreignField': '_id', 
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
              'from': 'products', 
              'localField': 'productPrices.product', 
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
            '$match': {
              'products.available': true,
              'products.isNeglected': false,
            }
          },
          {
            '$lookup': {
              'from': 'favouriteproducts', 
              'localField': 'products._id', 
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
                'products.favourite': {
                    '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$products._id" ] } ]
                }
            }
        },
        {
            '$addFields': {
                'products.cart': {
                    '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$productPrices._id", "$shipCards.productPrice" ] } ]
                },
                'products.productPrices':'$productPrices._id'
            }
        },
            {
              '$group': {
               '_id': '$products',
               'count': { '$sum': 1 },
                'productPrices': {
                    '$first': '$productPrices'
                },
               }
           },
           {
            '$addFields': {
              '_id.price': "$productPrices.price",
            }
          },
           {
            '$project': {
                '_id._id': 1,
                '_id.avatar': 1,
                '_id.productPrices': 1,
                '_id.nameAr': 1,
                '_id.nameEn': 1,
                '_id.available': 1,
                '_id.price.initialPrice': 1,
                '_id.price.reducedPrice': { "$ifNull": [ "$_id.price.reducedPrice", "$_id.price.initialPrice" ] },
                '_id.favourite': 1,
                '_id.cart': 1,
                'count': 1,
            }
           }, 
           {
            '$addFields': {
              '_id.discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$_id.price.initialPrice","$_id.price.reducedPrice"] }, '$_id.price.initialPrice' ]}]},
            }
          },
           { '$sort' : { 'count' : -1} },
           { '$limit' : maxLimit }
      ];
      let getProducts = await shipItems.aggregate(aggr);
      if(getProducts.length != 0)
      {
        getProducts = getProducts.map(product=>{
            product._id.avatar = input.app.get('defaultAvatar')(input, 'host') + product._id.avatar;
            return product;
        })
     }
      return (getProducts);
    }
  }





  
async function getBestReviews(input) {
  let userId = input.query.userId;
  let appSettings = await AppSettings.findOne();
  let maxLimit = appSettings.maxLimit;
  let productMethod = appSettings.productMethod;
  if(productMethod == "manual")
  {
  let agg = [
    {
      '$match': {
        'isNeglected': false,
        'available': true,
        'bestReviews': true
      }
    },
        {
        '$lookup': {
          'from': 'productprices', 
          'localField': '_id', 
          'foreignField': 'product', 
          'as': 'ProductPrices'
        }
    },
    {
        '$unwind': {
          'path': '$ProductPrices',
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
          'localField': 'ProductPrices._id', 
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
        '$lookup': {
          'from': 'shipitems', 
          'localField': 'ProductPrices._id', 
          'foreignField': 'product.productPrice', 
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
        '$addFields': {
            'favourite': {
                '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$_id" ] } ]
            }
        }
    },
    {
        '$addFields': {
            'cart': {
                '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$ProductPrices._id", "$shipCards.productPrice" ] } ]
            },
            'productPrices':'$ProductPrices._id'
        }
    },
        {
          '$group': {
          '_id': '$_id',
          'rate': {
            '$avg': "$shipitems.rate.rate" 
            },
          'avatar': {
          '$first': '$avatar'
          },
          'nameAr': {
            '$first': '$nameAr'
          },
          'nameEn': {
            '$first': '$nameEn'
          },
          'productPrices': {
              '$first': '$productPrices'
          },
          'bestReviews': {
            '$first': '$bestReviews'
          },
          'available': {
            '$first': '$available'
          },
          'favourite': {
            '$first': '$favourite'
          },
          'cart': {
            '$first': '$cart'
          },
          'price': {
            '$first': '$ProductPrices.price'
          },
           }
       },
       {
        '$project': {
            '_id': 1,
            'avatar': 1,
            'productPrices': 1,
            'nameAr': 1,
            'nameEn': 1,
            'bestReviews': 1,
            'available': 1,
            'price.initialPrice': 1,
            'price.reducedPrice': { "$ifNull": [ "$price.reducedPrice", "$price.initialPrice" ] },
            'favourite': 1,
            'cart': 1,
            'rate': 1,
        }
       }, 
       {
        '$addFields': {
          'discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$price.initialPrice","$price.reducedPrice"] }, '$price.initialPrice' ]}]},
        }
      },
      { '$sort' : { 'rate' : -1} },
      { '$limit' : maxLimit }
   ];
  let Products = await Product.aggregate(agg);
  if(Products.length != 0)
    {
      Products = Products.map(product=>{
          product.avatar = input.app.get('defaultAvatar')(input, 'host') + product.avatar;
          return product = {'_id':product,rate:product.rate};
      })
   }
  return Products;
  }
  else{
  let aggr = [
      {
        '$match': {
          'isNeglected': false,
        }
      },
          {
          '$lookup': {
            'from': 'productprices', 
            'localField': 'product.productPrice', 
            'foreignField': '_id', 
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
            'from': 'products', 
            'localField': 'productPrices.product', 
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
          '$match': {
            'products.available': true,
            'products.isNeglected': false,
          }
        },
        {
          '$lookup': {
            'from': 'favouriteproducts', 
            'localField': 'products._id', 
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
              'products.favourite': {
                  '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$products._id" ] } ]
              }
          }
      },
      {
          '$addFields': {
              'products.cart': {
                  '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$productPrices._id", "$shipCards.productPrice" ] } ]
              },
              'products.productPrices':'$productPrices._id'
          }
      },
          {
            '$group': {
             '_id': '$products',
             'rate': {
              '$avg': "$rate.rate" 
              },
              'productPrices': {
                  '$first': '$productPrices'
              },
             }
         },
         {
          '$addFields': {
            '_id.price': "$productPrices.price",
          }
        },
         {
          '$project': {
              '_id._id': 1,
              '_id.avatar': 1,
              '_id.productPrices': 1,
              '_id.nameAr': 1,
              '_id.nameEn': 1,
              '_id.bestReviews': 1,
              '_id.available': 1,
              '_id.price.initialPrice': 1,
              '_id.price.reducedPrice': { "$ifNull": [ "$_id.price.reducedPrice", "$_id.price.initialPrice" ] },
              '_id.favourite': 1,
              '_id.cart': 1,
              'rate': 1,
          }
         }, 
         {
          '$addFields': {
            '_id.discountPrecentage': { "$multiply": [100,{"$divide": [ { "$subtract": ["$_id.price.initialPrice","$_id.price.reducedPrice"] }, '$_id.price.initialPrice' ]}]},
          }
        },
        { '$sort' : { 'rate' : -1} },
        { '$limit' : maxLimit }
    ];
    let getProducts = await shipItems.aggregate(aggr);
    if(getProducts.length != 0)
    {
      getProducts = getProducts.map(product=>{
          product._id.avatar = input.app.get('defaultAvatar')(input, 'host') + product._id.avatar;
          return product;
      })
   }
    return (getProducts);
  }
}


module.exports = {
    shipItems,
    validateAddShipItems,
    getBestSelling,
    getTrending,
    getBestReviews,
}


