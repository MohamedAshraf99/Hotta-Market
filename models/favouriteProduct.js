const Joi = require('joi');
const mongoose = require('mongoose');


const favouriteProductSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    date: {
        type: Date,
        default: Date.now(),
    },
});

const FavouriteProduct = mongoose.model('FavouriteProduct', favouriteProductSchema);



const validateAdd = (body) => {
    let schema = {
        user: Joi.string().length(24).required(),
        product: Joi.string().length(24).required(),
    };

    return Joi.validate(body, schema);
}


const getFavouriteProducts = async (input) => {

    let { startId = false, limit = 10, all = false } = input.query;

    startId = (all || !startId) ? {} : { '_id': { '$gt': startId } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);
    

    let cats = await Cat.find({...startId, }).limit(limit);

    if (cats.length)
        cats = cats.map(cat => {
            ['avatar', 'icon'].map(field => {
                if (cat[field]) cat[field] = input.app.get('defaultAvatar')(input, 'host') + cat[field]
                else cat[field] = input.app.get('defaultAvatar')(input)
            })
            
            return cat;
        });


    return cats
}


const addFavouriteProduct = async (input) => {

    const { error } = validateAdd(input.body);
    if (error) return (error.details[0]);

    let newFavouriteProduct = new FavouriteProduct(input.body)

    newFavouriteProduct = await newFavouriteProduct.save();

    return newFavouriteProduct;
}



const toggleFavouriteProduct = async (input) => {

    const { error } = validateAdd(input.body);
    if (error) return (error.details[0]);

    let count = await FavouriteProduct.find({user: input.body.user,product:input.body.product}).count()

    if(count) {
        let deletedFavouriteProduct = await FavouriteProduct.findOneAndDelete({user: input.body.user,product:input.body.product})
        if(deletedFavouriteProduct) return {}
    } else {
        let newFavouriteProduct = new FavouriteProduct(input.body)
        newFavouriteProduct = await newFavouriteProduct.save();
        if(newFavouriteProduct._id) return newFavouriteProduct;
    }
}




module.exports = {
    FavouriteProduct,
    addFavouriteProduct,
    getFavouriteProducts,
    toggleFavouriteProduct,
}


