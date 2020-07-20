const Joi = require('joi');
const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    action:{
        type:String
    },
    order:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order'
    }
});

const Notification = mongoose.model('Notification', notificationSchema);


function validateNotification(req) {
    let schema = {
        title: Joi.string().required(),
        user: Joi.string().length(24).required(),
        description: Joi.string().required(),
        issueDate: Joi.string().required(),
    };

    return Joi.validate(req, schema);
}


exports.Notification = Notification;
exports.validateNotification = validateNotification;

