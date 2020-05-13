const Joi = require('joi');
const mongoose = require('mongoose');


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
        orderShips: Joi.string().length(24).required(),
        requiredDateTime: Joi.date().required(),
        rate: Joi.object().optional(),
        product: Joi.object().required(),
    };

    return Joi.validate(body, schema);
}



async function getBestSelling(input) {
    let userId = input.query.userId;

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
                }
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
                '_id.nameAr': 1,
                '_id.nameEn': 1,
                '_id.price.initialPrice': 1,
                '_id.price.reducedPrice': 1,
                '_id.favourite': 1,
                '_id.cart': 1,
                'count': 1,
                '_id.newPrice': { "$subtract": ['$_id.price.initialPrice',{"$multiply": [ { "$divide": ["$_id.price.reducedPrice",100] }, '$_id.price.initialPrice' ]}]},
            }
           }, 
           { '$sort' : { 'count' : -1} },
           { '$limit' : 30 }
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


  async function getTrending(input) {
    let userId = input.query.userId;
    let currentDate = new Date();
    let lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
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
                }
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
                '_id.nameAr': 1,
                '_id.nameEn': 1,
                '_id.price.initialPrice': 1,
                '_id.price.reducedPrice': 1,
                '_id.favourite': 1,
                '_id.cart': 1,
                'count': 1,
                '_id.newPrice': { "$subtract": ['$_id.price.initialPrice',{"$multiply": [ { "$divide": ["$_id.price.reducedPrice",100] }, '$_id.price.initialPrice' ]}]},
            }
           }, 
           { '$sort' : { 'count' : -1} },
           { '$limit' : 30 }
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





  
async function getBestReviews(input) {
  let userId = input.query.userId;

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
              '_id.nameAr': 1,
              '_id.nameEn': 1,
              '_id.price.initialPrice': 1,
              '_id.price.reducedPrice': 1,
              '_id.favourite': 1,
              '_id.cart': 1,
              'rate': 1,
              '_id.newPrice': { "$subtract": ['$_id.price.initialPrice',{"$multiply": [ { "$divide": ["$_id.price.reducedPrice",100] }, '$_id.price.initialPrice' ]}]},
          }
         }, 
         { '$sort' : { 'rate' : -1} },
         { '$limit' : 30 }
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


module.exports = {
    shipItems,
    validateAddShipItems,
    getBestSelling,
    getTrending,
    getBestReviews,
}


