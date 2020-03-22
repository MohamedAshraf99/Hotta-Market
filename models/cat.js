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
        avatar: Joi.string().required(),
        profitPercentage: Joi.number().optional(),
    };

    return Joi.validate(body, schema);
}


const getCats = async (input) => {

    let cats = await Cat.find();

    if (cats.length)
        cats = cats.map(cat => {
            if (cat.avatar) cat.avatar = input.app.get('DefaultAvatar')(input, 'host') + cat.avatar
            else cat.avatar = input.app.get('DefaultAvatar')(input)
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
        if (newCat.avatar) newCat.avatar = input.app.get('DefaultAvatar')(input, 'host') + newCat.avatar
        else newCat.avatar = input.app.get('DefaultAvatar')(input)
    }

    return newCat;
}


module.exports = {
    Cat,
    getCats,
    addCat,
}


