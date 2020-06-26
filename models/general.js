const Joi = require('joi');
const mongoose = require('mongoose');



const generalSchema = new mongoose.Schema({  
    name: {
        type: String,
        maxlength: 50,
        required: true,
    },
    title: {
        type: String,
        maxlength: 50,
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const General = mongoose.model('General', generalSchema);


module.exports = {
    General,
}


