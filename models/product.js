const Joi = require('joi');
const mongoose = require('mongoose');
const {productPriceSchema, ProductPrice} = require('./productPrice')
const _ = require('lodash')



const productSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cat",
        required: true,
    },   
    nameAr: {
        type: String,
        required: true,
    },
    nameEn: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        unique: true,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    avatar: [String],
    desc: String,
    available: {
        type: Boolean,
        default: true,
    },    
    isNeglected: {
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
        vendor: Joi.string().length(24).required(),
        cat: Joi.string().length(24).required(),
        nameAr: Joi.string().required(),
        nameEn: Joi.string().required(),
        code: Joi.string().required(),
        taxState: Joi.bool().optional(),
        desc: Joi.string().optional(),
        available: Joi.bool().optional(),
        productPrices: Joi.array().required(),
    };

    return Joi.validate(body, schema);
}

const addProduct = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newProduct = {},
        productPricesArr = body.productPrices;

    //transaction guaranted 
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        //start code

        newProduct = await Product.insertMany([_.omit(body, ['productPrices'])], {session})
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
        await session.commitTransaction()
        session.endSession()
    } catch (err) {
        console.log(err);
        await session.abortTransaction()
        session.endSession()
    }
    //end transaction

    return newProduct;
}
async function getProductDetails(input) {
    let startId = input.params.id;
    let userId = input.query.userId;
    let type = input.query.type;
    if(type =="admin"){
        let aggr = [
            {
              '$match': {
                '_id': mongoose.Types.ObjectId(startId),
                'isNeglected': false
              }
            },
                {
                '$lookup': {
                  'from': 'productPrices', 
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
                  'localField': 'vendor', 
                  'foreignField': '_id', 
                  'as': 'vendor'
                }
            },
            {
                '$unwind': {
                  'path': '$vendor',
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
                        '$first': '$vendor.phone'
                    },
                    'description': {
                        '$first': '$description'
                    },
                    'price': {
                        '$first': '$productPrices.prices'
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
                    'phoneNumber':1,
                    'price.initialPrice': 1,
                }
               }, 
               
          ];
          let getProducts = await Product.aggregate(aggr);
          if(getProducts.length != 0)
            {
                getProducts[0].avatar = getProducts[0].avatar.map(product => {
                product = input.app.get('defaultAvatar')(input, 'host') + product
                    return product;
                })
            }
          return (getProducts);
    }
    else{
    let aggr = [
        {
          '$match': {
            '_id': mongoose.Types.ObjectId(startId),
            'isNeglected': false
          }
        },
            {
            '$lookup': {
              'from': 'productPrices', 
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
              'localField': 'vendor', 
              'foreignField': '_id', 
              'as': 'vendor'
            }
        },
        {
            '$unwind': {
              'path': '$vendor',
              'preserveNullAndEmptyArrays': true
            }
          },
          {
            '$lookup': {
              'from': 'shipItems', 
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
              'from': 'favouriteProducts', 
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
                    '$and': [ { '$eq': [ "$favouriteProducts.user", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$favouriteProducts.product", "$_id" ] } ]
                }
            }
        },
        {
            '$addFields': {
                'cart': {
                    '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$productPrices._id", "$shipCards.productPrice" ] } ]
                }
            }
        },
          //   {
          //     '$group': {
          //      '_id': '$_id',
          //      'avatar': {
          //       '$first': '$avatar'
          //       },
          //       'nameAr': {
          //           '$first': '$nameAr'
          //       },
          //       'nameEn': {
          //           '$first': '$nameEn'
          //       },
          //       'shopName': {
          //           '$first': '$vendor.commercialName'
          //       },
          //       'description': {
          //           '$first': '$description'
          //       },
          //       'price': {
          //           '$first': '$productPrices.prices'
          //       },
          //       'favourite': {
          //           '$first': '$favourite'
          //       },
          //       'cart': {
          //           '$first': '$cart'
          //       },
          //       'totalRates':{ '$addToSet': '$shipItems.rate.rate' },
          //       'rate': {
          //           '$avg': "$shipItems.rate.rate" 
          //   },
          //      }
          //  },
          //  {
          //   '$project': {
          //       '_id': 1,
          //       'avatar': 1,
          //       'nameAr': 1,
          //       'nameEn': 1,
          //       'shopName': 1,
          //       'description': 1,
          //       'price.initialPrice': 1,
          //       'price.reducedPrice': 1,
          //       'favourite': 1,
          //       'cart': 1,
          //       'totalRates': 1,
          //       'rate': 1,
          //       'newPrice': { "$subtract": ['$price.initialPrice',{"$multiply": [ { "$divide": ["$price.reducedPrice",100] }, '$price.initialPrice' ]}]},
          //   }
          //  }, 
           
      ];
      let getProducts = await Product.aggregate(aggr);
    //   if(getProducts.length != 0)
    //   {
    //     getProducts[0].totalRates = getProducts[0].totalRates.length;
    //     console.log(getProducts[0]);
    //     getProducts[0].avatar = getProducts[0].avatar.map(product => {
    //     product = input.app.get('defaultAvatar')(input, 'host') + product
    //         return product;
    //     })
    //  }
      return (getProducts);
    }
     
  }


module.exports = {
    Product,
    addProduct,
    getProductDetails,
}


