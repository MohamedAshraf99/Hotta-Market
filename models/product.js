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
    linkedProducts: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product",
            default: []
    },       
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
    session.startTransaction({ readPreference: { mode: "primary" } })
    try {
        //start code

        newProduct = new Product(_.omit(body, ['productPrices']))
        newProduct = await newProduct.save({session})

        // if (newProduct._id) {
        //     productPricesArr = productPricesArr
        //         .map(pp => ({ ...pp, product: newProduct._id }));

        //         // throw new Error("message");

        //     productPricesArr = await ProductPrice
        //         .insertMany(productPricesArr, { session });

        //     newProduct.productPrices = productPricesArr;
        // }

        //start end
        await session.commitTransaction()
    } catch (err) {
        await session.abortTransaction()
    } finally {
        session.endSession()
    }
    //end transaction

    if (newProduct._id)
    console.log(newProduct);

    return newProduct;
}






module.exports = {
    Product,
    addProduct,
}


