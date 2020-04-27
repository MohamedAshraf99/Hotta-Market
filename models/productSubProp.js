const Joi = require('joi');
const mongoose = require('mongoose');



const productSubPropSchema = new mongoose.Schema({
    productMainProp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductMainProp",
        required: true,
    },
    nameAr: {
        type: String,
        maxlength: 50,
        required: true,
    },
    nameEn: {
        type: String,
        maxlength: 50,
        required: true,
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


const ProductSubProp = mongoose.model('ProductSubProp', productSubPropSchema);




const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).required(),
        nameEn: Joi.string().min(3).required(),
        productMainProp: Joi.string().length(24).required(),
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        nameAr: Joi.string().min(3).optional(),
        nameEn: Joi.string().min(3).optional(),
        isNeglected: Joi.bool().optional(),
        productMainProp: Joi.string().length(24).required(),
    };

    return Joi.validate(body, schema);
}


const getSubProps = async (input) => {
    return await ProductSubProp.find();
}


const addSubProp = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newMainProp = new ProductMainProp(body)

    newMainProp = await newMainProp.save();

    return newMainProp;
}


const updateSubProp = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedSubProp = await ProductSubProp.findByIdAndUpdate(id, body, {new: true})

    return updatedSubProp;
}


const deleteSubProp = async (input) => {
    let { id } = input.params;
    return await ProductSubProp.findByIdAndDelete(id)
}


module.exports = {
    ProductSubProp,
    getSubProps,
    addSubProp,
    updateSubProp,
    deleteSubProp,
}