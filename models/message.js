const Joi = require('joi');
const mongoose = require('mongoose');



const messageSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },    
    message: {
        type: String,
        required: true,
    },
});


const Message = mongoose.model('Message', messageSchema);


module.exports = {
    Message,
}


