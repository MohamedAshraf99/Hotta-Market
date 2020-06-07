const Joi = require('joi');
const mongoose = require('mongoose');


const appSettingsSchema = new mongoose.Schema({
    generalTax: {
        type: Number,
        required: true
    },
    ProfitCalcMethod: {
        type: String,
        required: true,
        enum: ["cats", "provider"]
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


