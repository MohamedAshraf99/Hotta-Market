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
        nameAr: {
        type: String,
        maxlength: 50,
        required: true,
    },
    additional: String,
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
        nameAr: Joi.string().min(1).required(),
        nameEn: Joi.string().min(1).required(),
        additional: Joi.string().optional(),
        productMainProp: Joi.string().length(24).required(),
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        nameAr: Joi.string().min(1).optional(),
        nameEn: Joi.string().min(1).optional(),
        additional: Joi.string().optional(),
        isNeglected: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}


const getSubProps = async (input) => {
    let productMainPropId = input.query.mainPropId || ""

    return await ProductSubProp.find({productMainProp: productMainPropId});
}


const addSubProp = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newMainProp = new ProductSubProp(body)

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