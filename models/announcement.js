const Joi = require('joi');
const mongoose = require('mongoose');


const announcementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    announcementPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnnouncementPlan",
        required: true,
    },
    avatars: [{
        avatar: String,
        link: String,
    }],
    price: {
        type: Number,
        required: true,
        min: 1
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Announcement = mongoose.model('Announcement', announcementSchema);


module.exports = {
    Announcement
}


