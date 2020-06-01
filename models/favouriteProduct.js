const Joi = require('joi');
const mongoose = require('mongoose');
const {User} = require('../models/user');

const favouriteProductSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    date: {
        type: Date,
        default: Date.now(),
    },
});

const FavouriteProduct = mongoose.model('FavouriteProduct', favouriteProductSchema);



const validateAdd = (body) => {
    let schema = {
        user: Joi.string().length(24).required(),
        product: Joi.string().length(24).required(),
    };

    return Joi.validate(body, schema);
}


const getFavouriteProducts = async (input) => {

    let userId = input.params.id;
    let { startId = false, limit = 10, all = false } = input.query;

    startId = (!startId || startId == "false") ? false : startId

    startId = (all || !startId) ? {} : { '_id._id': { '$gt': mongoose.Types.ObjectId(startId) } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);

    let aggr = [
        {
          '$match': {
            'user': mongoose.Types.ObjectId(userId),
          }
        },
          {
            '$lookup': {
              'from': 'products', 
              'localField': 'product', 
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
              'from': 'productprices', 
              'localField': 'products._id', 
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
                'products.cart': {
                    '$and': [ { '$eq': [ "$shipCards.client", mongoose.Types.ObjectId(userId) ] }, { '$eq': [ "$productPrices._id", "$shipCards.productPrice" ] } ]
                },
                'products.productPrices':'$productPrices._id'
            }
        },
            {
              '$group': {
               '_id': '$products',
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
                '_id.price.initialPrice': 1,
                '_id.price.reducedPrice': 1,
                '_id.favourite': 1,
                '_id.cart': 1,
                '_id.newPrice': { "$subtract": ['$_id.price.initialPrice',{"$multiply": [ { "$divide": ["$_id.price.reducedPrice",100] }, '$_id.price.initialPrice' ]}]},
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
      let getProducts = await FavouriteProduct.aggregate(aggr);
      if(getProducts.length != 0)
      {
        getProducts = getProducts.map(product=>{
            product._id.avatar = input.app.get('defaultAvatar')(input, 'host') + product._id.avatar;
            return product;
        })
     }
      return (getProducts);
}


const addFavouriteProduct = async (input) => {

    const { error } = validateAdd(input.body);
    if (error) return (error.details[0]);

    let newFavouriteProduct = new FavouriteProduct(input.body)

    newFavouriteProduct = await newFavouriteProduct.save();

    return newFavouriteProduct;
}



const toggleFavouriteProduct = async (input) => {

    const { error } = validateAdd(input.body);
    if (error) return (error.details[0]);

    let count = await FavouriteProduct.find({user: input.body.user,product:input.body.product}).count()

    if(count) {
        let deletedFavouriteProduct = await FavouriteProduct.findOneAndDelete({user: input.body.user,product:input.body.product})
        if(deletedFavouriteProduct) return {}
    } else {
        let newFavouriteProduct = new FavouriteProduct(input.body)
        newFavouriteProduct = await newFavouriteProduct.save();
        if(newFavouriteProduct._id) return newFavouriteProduct;
    }
}




module.exports = {
    FavouriteProduct,
    addFavouriteProduct,
    getFavouriteProducts,
    toggleFavouriteProduct,
}


