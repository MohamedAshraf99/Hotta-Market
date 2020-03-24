const Joi = require('joi');
const mongoose = require('mongoose');
const {productPriceSchema, ProductPrice} = require('./productPrice')
const _ = require('lodash')



const productSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cat",
        required: true,
    },
    linkedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],       
    nameAr: {
        type: String,
        required: true,
    },
    nameEn: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        unique: true,
        required: true,
    },
    taxState: {
        type: Boolean,
        default: false,
    },    
    isNeglected: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    },
    productPrices: [productPriceSchema]
});


const Product = mongoose.model('Product', productSchema);



const validateAdd = (body) => {
    let schema = {
        vendor: Joi.string().length(24).required(),
        cat: Joi.string().length(24).required(),
        linkedProducts: Joi.array().optional(),
        nameAr: Joi.string().required(),
        nameEn: Joi.string().required(),
        code: Joi.string().required(),
        taxState: Joi.bool().optional(),
        productPrices: Joi.array().required(),
    };

    return Joi.validate(body, schema);
}

const addProduct = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newProduct = {},
    productPricesArr = body.productPrices;


    //transaction guaranted
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        //start code

        newProduct = await Product
            .create(_.omit(body, ['productPrices']), { session })

        if (newProduct._id) {
            productPricesArr = productPricesArr
                .map(pp => ({ ...pp, product: newProduct._id }));

            productPricesArr = await ProductPrice
                .insertMany(productPricesArr, { session });
        }

        //start end
        await session.commitTransaction()
        session.endSession()
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
    }
    //end transaction




    return newCat;
}






module.exports = {
    Product,
    addProduct,
}


