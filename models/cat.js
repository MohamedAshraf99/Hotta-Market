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
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Cat = mongoose.model('Cat', catSchema);


const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).required(),
        nameEn: Joi.string().min(3).required(),
        parent: Joi.string().length(24).optional(),
        type: Joi.string().required(),
        avatar: Joi.string().required(),
        icon: Joi.string().required(),
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
            
            return cat;
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

    return newCat;
}


module.exports = {
    Cat,
    getCats,
    addCat,
}


