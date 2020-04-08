const Joi = require('joi');
const mongoose = require('mongoose');



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
    icon: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['vendor', 'productiveFamily', 'admin']
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
        parent: Joi.string().length(24).optional(),
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
        parent: Joi.string().length(24).optional(),
        type: Joi.string().optional(),
        isNeglected: Joi.bool().optional(),
        avatar: Joi.string().optional(),
        icon: Joi.string().optional(),
        profitPercentage: Joi.number().optional(),
    };

    return Joi.validate(body, schema);
}


const getCats = async (input) => {

    let { startId = false, limit = 10, all = false } = input.query;

    startId = (all || !startId) ? {} : { '_id': { '$gt': startId } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);
    

    let cats = await Cat.find({...startId, }).limit(limit);

    if (cats.length)
        cats = cats.map(cat => {
            ['avatar', 'icon'].map(field => {
                if (cat[field]) cat[field] = input.app.get('DefaultAvatar')(input, 'host') + cat[field]
                else cat[field] = input.app.get('DefaultAvatar')(input)
            })

            let lang = (input.headers["accept-language"]).split('-')[0] == 'en'? "En": "Ar"
            
            return {...cat._doc, name: cat[`name${lang}`]};
        });

    return cats
}


const addCat = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newCat = new Cat(body)

    newCat = await newCat.save();

    if (newCat._id) {
        ['avatar', 'icon'].map(field => {
            if (newCat[field]) newCat[field] = input.app.get('DefaultAvatar')(input, 'host') + newCat[field]
            else newCat[field] = input.app.get('DefaultAvatar')(input)
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

    let updatedCat = await Cat.findOneAndUpdate({_id: id}, body, {new: true})

    if (updatedCat._id) {
        ['avatar', 'icon'].map(field => {
            if (updatedCat[field])
                updatedCat[field] = input.app.get('DefaultAvatar')(input, 'host') + updatedCat[field]
            else updatedCat[field] = input.app.get('DefaultAvatar')(input)
        })
    }

    let lang = (input.headers["accept-language"]).split('-')[0] == 'en'? "En": "Ar"
            
    return {...updatedCat._doc, name: updatedCat[`name${lang}`]};
}


module.exports = {
    Cat,
    getCats,
    addCat,
    updateCat
}


