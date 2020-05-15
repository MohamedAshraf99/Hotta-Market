const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');



const catSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cat",
    },
    nameAr: {
        type: String,
        required: true,
        unique: true,
    },
    nameEn: {
        type: String,
        required: true,
        unique: true,
    },
    avatar: {
        type: String,
        required: true
    },
    profitPercentage: {
        type: Number,
        default: 0
    },
    isNeglected: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        required: true,
        enum: ['admin', 'vendor', 'productiveFamily']
    },
    dateCreate: {
        type: Date,
        default: Date.now
    },
});


const Cat = mongoose.model('Cat', catSchema);


const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).required(),
        nameEn: Joi.string().min(3).required(),
        parent: Joi.string().optional(),
        type: Joi.string().required(),
        isNeglected: Joi.bool().optional(),
        avatar: Joi.string().required(),
        icon: Joi.string().required(),
        profitPercentage: Joi.number().optional(),
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).optional(),
        nameEn: Joi.string().min(3).optional(),
        parent: Joi.string().optional(),
        isNeglected: Joi.bool().optional(),
        avatar: Joi.string().optional(),
        icon: Joi.string().optional(),
        profitPercentage: Joi.number().optional(),
    };

    return Joi.validate(body, schema);
}


const validateToggleNeglectCats = (body) => {
    let schema = {
        neglected: Joi.bool().required(),
        ids: Joi.array().required(),
    };

    return Joi.validate(body, schema);
}



const getCats = async (input) => {

    let { startId = false, limit = 10, all = false } = input.query;

    startId = (!startId || startId == "false") ? false: startId

    startId = (all || !startId) ? {} : { '_id': { '$gt': mongoose.Types.ObjectId(startId) } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);


    let parent = {}

    if(input.query.parent){
        if(input.query.parent == "false")
            parent = { parent: { $eq: null } }
        else 
        parent = { parent: mongoose.Types.ObjectId(input.query.parent) }
    }
           
    
    let cats = await Cat.aggregate([
        {
            '$match': startId
        }, {
            '$match': {
                'isNeglected': false,
                ...parent
            }
        }, {
            '$lookup': {
                'from': 'cats',
                'localField': '_id',
                'foreignField': 'parent',
                'as': 'hasChildren'
            }
        }, {
            '$unwind': {
                'path': '$hasChildren',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$match': {
                '$expr': {
                    '$ne': [
                        '$hasChildren', null
                    ]
                }
            }
        }, {
            '$group': {
                '_id': '$_id',
                'doc': {
                    '$first': '$$ROOT'
                },
                'hasChildren': {
                    '$push': '$hasChildren'
                }
            }
        }, {
            '$addFields': {
                'doc.hasChildren': '$hasChildren'
            }
        }, {
            '$project': {
                'hasChildren': 0
            }
        }, {
            '$replaceRoot': {
                'newRoot': '$doc'
            }
        }, {
            '$addFields': {
                'hasChildren': {
                    '$cond': {
                        'if': {
                            '$eq': [
                                {
                                    '$size': '$hasChildren'
                                }, 0
                            ]
                        },
                        'then': false,
                        'else': true
                    }
                }
            }
        }, {
            '$lookup': {
                'from': 'products', 
                'let': {
                    'catId': '$_id'
                }, 
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$and': [
                                    {
                                        '$in': [
                                            '$$catId', '$cats'
                                        ]
                                    }, {
                                        'isNeglected': false
                                    }
                                ]
                            }
                        }
                    }
                ], 
                'as': 'hasProducts'
            }
        }, {
            '$addFields': {
                'hasProducts': {
                    '$cond': {
                        'if': {
                            '$eq': [
                                {
                                    '$size': '$hasProducts'
                                }, 0
                            ]
                        }, 
                        'then': false, 
                        'else': true
                    }
                }
            }
        }, {
            '$sort': {
                _id: 1
            }
        },{
            '$limit': limit? limit: Infinity
        }
    ]);

    if (cats.length)
        cats = cats.map(cat => {
            ['avatar', 'icon'].map(field => {
                if (cat[field]) cat[field] = input.app.get('defaultAvatar')(input, 'host') + cat[field]
                else cat[field] = input.app.get('defaultAvatar')(input)
            })

            let lang = (input.headers["accept-language"]).split('-')[0] == 'en'? "En": "Ar"
            
            return {...cat, name: cat[`name${lang}`]};
        });

    return cats
}

const addCat = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let isParentDeleted = body.parent == "0" ?
        { $unset: { parent: 1 } } : false

    if (isParentDeleted) body = _.omit(body, ["parent"]);

    let newCat = new Cat({...body, ...isParentDeleted})
    newCat = await newCat.save();

    if (newCat._id){
        ['avatar', 'icon'].map(field => {
            if (newCat[field]) newCat[field] = input.app.get('defaultAvatar')(input, 'host') + newCat[field]
            else newCat[field] = input.app.get('defaultAvatar')(input)
        })
    }

    let lang = (input.headers["accept-language"]).split('-')[0] == 'en'? "En": "Ar"
            
    return {...newCat._doc, name: newCat[`name${lang}`]};
}


const updateCat = async (input) => {

    let body = input.body,
        id = input.params.id

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let isParentDeleted = body.parent == "0" ?
        { $unset: { parent: 1 } } : false

    if(isParentDeleted) body = _.omit(body, ["parent"]);

    let updatedCat = await Cat.findOneAndUpdate(
        { _id: id },
        { ...body, ...isParentDeleted },
        { new: true }
    )


    if (updatedCat._id) {
        ['avatar', 'icon'].map(field => {
            if (updatedCat[field])
                updatedCat[field] = input.app.get('defaultAvatar')(input, 'host') + updatedCat[field]
            else updatedCat[field] = input.app.get('defaultAvatar')(input)
        })
    }

    let lang = (input.headers["accept-language"]).split('-')[0] == 'en'? "En": "Ar"
            
    return {...updatedCat._doc, name: updatedCat[`name${lang}`]};
}

const toggleNeglectCats = async (input) => {

    let {ids, neglected} = input.body;

    const { error } = validateToggleNeglectCats(input.body);
    if (error) return (error.details[0]);

    let cats = await Cat.updateMany(
        { _id: { $in: ids } },
        { $set: { isNeglected : neglected } },
        {multi: true}
    )

    return cats
}

async function getsubCategories(input) {
    let startId = input.params.id;
    let type = input.query.type;
    if(type == "vendor")
    {
    let aggr = [
        {
          '$match': {
            '_id': mongoose.Types.ObjectId(startId),
            'isNeglected': false
          }
        },
        {
            '$lookup': {
              'from': 'products', 
              'localField': '_id', 
              'foreignField': 'cats', 
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
              'localField': 'products.provider', 
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
              'from': 'areas', 
              'localField': 'vendor.location.area', 
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
              'as': 'city'
            }
        },
        {
            '$unwind': {
              'path': '$city',
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
            '$addFields': {
              'vendor.areaAr': "$area.nameAr"  ,
              'vendor.areaEn': "$area.nameEn"  ,
              'vendor.cityAr': "$city.nameAr",
              'vendor.cityEn': "$city.nameEn"
            }
          },
            {
              '$group': {
               '_id': '$vendor',
                'rate': {
                     '$avg': "$shipItems.rate.rate" 
                },
               }
           },
           {
            '$addFields': {
              '_id.rate': "$rate",
              '_id.avatar': { $concat: [input.app.get('defaultAvatar')(input, 'host'), "$_id.avatar"] },
              '_id.icon': { $concat: [input.app.get('defaultAvatar')(input, 'host'), "$_id.icon"] }
            }
          },
           {
            '$project': {
                '_id._id': 1,
                '_id.commercialName': 1,
                '_id.icon': 1,
                '_id.avatar': 1,
                '_id.rate': 1,
                '_id.areaAr': 1,
                '_id.areaEn': 1,
                '_id.cityAr': 1,
                '_id.cityEn': 1,
            }
           }, 
           
      ];
      let subCategories = await Cat.aggregate(aggr);
      if(subCategories[0]._id.avatar == null && subCategories[0]._id.rate == null &&subCategories[0]._id.icon == null)
      {return subCategories = []; }
      else{
      return (subCategories);
      }
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
                  'from': 'products', 
                  'localField': '_id', 
                  'foreignField': 'cats', 
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
                  'localField': 'products.provider', 
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
                '$addFields': {
                  'product': '$products._id',
                }
              },
            
                {
                  '$group': {
                   '_id': '$vendor',
                   'product':{
                       '$addToSet':'$product'
                   }
                   }
               },
               {
                '$addFields': {
                  
                  '_id.avatar': { $concat: [input.app.get('defaultAvatar')(input, 'host'), "$_id.avatar"] },
                }
              },
               {
                '$project': {
                    '_id._id': 1,
                    '_id.commercialName': 1,
                    'product': 1,
                    '_id.avatar': 1,
                    '_id.desc': 1,
                }
               }, 
          ];
          let subCategories = await Cat.aggregate(aggr);
          if(subCategories[0]._id.avatar == null)
          {return subCategories =[];}
          else{
          return (subCategories);
         }
    }




  }
  

module.exports = {
    Cat,
    getCats,
    addCat,
    updateCat,
    toggleNeglectCats,
    getsubCategories,
}

