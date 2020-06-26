const Joi = require('joi');
const mongoose = require('mongoose');


const announcementPlanSchema = new mongoose.Schema({
    fromDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    toDate: {
        type: Date,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 1
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


const AnnouncementPlan = mongoose.model('AnnouncementPlan', announcementPlanSchema);


module.exports = {
    AnnouncementPlan
}


