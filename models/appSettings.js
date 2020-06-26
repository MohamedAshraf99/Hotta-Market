const Joi = require('joi');
const mongoose = require('mongoose');


const appSettingsSchema = new mongoose.Schema({
    generalTax: {
        type: Number,
        required: true
    },
    profitCalcMethod: {
        type: String,
        required: true,
        enum: ["cats", "provider"]
    },
    maxLimit: {
        type: Number
    },
    productMethod: {
        type: String,
        required: true,
        enum: ["automatic", "manual"]
    },
    isNeglected: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const AppSettings = mongoose.model('AppSettings', appSettingsSchema);


module.exports = {
    AppSettings,
}


