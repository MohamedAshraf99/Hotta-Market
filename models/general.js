const mongoose = require('mongoose');
const Joi = require('joi');


const generalSchema = new mongoose.Schema({
    page: {
        type: Number,
        required: true,
        enum: [1, 2],
        default: 1,
    },
    title: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    message: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 3000
    },
    titleAr: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    messageAr: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 3000
    }
});

const General = mongoose.model('General', generalSchema);

function validateGeneral(req, state) {
    let schema = {
        title: Joi.string().min(5).max(255).required(),
        message: Joi.string().min(5).max(3000).required(),
        titleAr: Joi.string().min(5).max(255).required(),
        messageAr: Joi.string().min(5).max(3000).required(),
    };

    if (state) schema["_id"] = Joi.string().length(24).required();

    return Joi.validate(req, schema);
}


exports.General = General;
exports.validateGeneral = validateGeneral;


