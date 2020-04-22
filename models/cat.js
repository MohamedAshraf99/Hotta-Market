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
        type: Joi.string().optional(),
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


const getCats_OldWithoutHasChildren = async (input) => {

    let { startId = false, limit = 10, all = false } = input.query;

    startId = (!startId || startId == "false") ? false: startId

    startId = (all || !startId) ? {} : { '_id': { '$gt': startId } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);
                    

    let cats = await Cat.find({...startId, }).limit(limit);

    if (cats.length)
        cats = cats.map(cat => {
            ['avatar', 'icon'].map(field => {
                if (cat[field]) cat[field] = input.app.get('defaultAvatar')(input, 'host') + cat[field]
                else cat[field] = input.app.get('defaultAvatar')(input)
            })

            let lang = (input.headers["accept-language"]).split('-')[0] == 'en'? "En": "Ar"
            
            return {...cat._doc, name: cat[`name${lang}`]};
        });

    return cats
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
            '$limit': limit
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


module.exports = {
    Cat,
    getCats,
    addCat,
    updateCat,
    toggleNeglectCats,
}

