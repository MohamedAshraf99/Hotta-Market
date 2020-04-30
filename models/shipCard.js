const Joi = require('joi');
const mongoose = require('mongoose');


const shipCardSchema = new mongoose.Schema({
    productPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductPrice",
        required: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
    }
});


const ShipCard = mongoose.model('ShipCard', shipCardSchema);

const validateAdd = (body) => {
    let schema = {
        productPrice: Joi.string().length(24).required(),
        client: Joi.string().length(24).required(),
        quantity: Joi.number().required()
    };

    return Joi.validate(body, schema);
}

const addCart = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);


    let newCart = new ShipCard({...body})
    newCart = await newCart.save();

    
            
    return newCart;
}

const deleteCart = async (input) => {

    let ids = input.body.ids;
    return await ShipCard.deleteMany({ _id: { $in: ids } });
}

module.exports = {
    ShipCard,
    addCart,
    deleteCart
}


