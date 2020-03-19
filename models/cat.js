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
});


const Cat = mongoose.model('Cat', catSchema);



const getCats = async (input) => {
    return await Cat.find();
}


module.exports = {
    Cat,
    getCats,
}


