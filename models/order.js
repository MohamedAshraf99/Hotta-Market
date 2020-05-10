const Joi = require('joi');
const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    log: [{
        date: {
            type: Date,
            default: Date.now()
        },
        state: {
            type: String,
            default: "new",
            enum: ['new', 'progress','complete', 'canceled']
        }
    }],
    isNeglected: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const Order = mongoose.model('Order', orderSchema);



const addOrder = async (input) => {

    let {body} = input,
    productPrices = body.productPrices || [{}],
    productBody = _.omit(body, ['productPrices']);


    const { error } = validateAdd(productBody);
    if (error) return (error.details[0]);

    for (let i = 0; i < productPrices.length; i++) {
      const { error } = productPriceValidateAdd(productPrices[i]);
      if (error) return (error.details[0]);
    }

    let newProduct = {},
        productPricesArr = body.productPrices;

    //transaction guaranted 
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        //start code

        newProduct = await Product.insertMany([_.omit(body, ['productPrices'])], {session})
        // newProduct = await newProduct.save({session})

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
        session.endSession()
    } catch (err) {
        console.log(err);
        await session.abortTransaction()
        session.endSession()
    }
    //end transaction

    return newProduct;
}

module.exports = {
    Order,
    addOrder
}


