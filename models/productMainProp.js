const Joi = require('joi');
const mongoose = require('mongoose');



const productMainPropSchema = new mongoose.Schema({  
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


const ProductMainProp = mongoose.model('ProductMainProp', productMainPropSchema);


const validateAdd = (body) => {
    let schema = {
        nameAr: Joi.string().min(1).required(),
        nameEn: Joi.string().min(1).required(),   
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        nameAr: Joi.string().min(1).optional(),
        nameEn: Joi.string().min(1).optional(),
        isNeglected: Joi.bool().optional(),
    };

    return Joi.validate(body, schema);
}


const getMainProps = async (input) => {
    return await ProductMainProp.find();
}


const getAllProps = async (input) => {

    return await ProductMainProp.aggregate([
      {
        '$lookup': {
          'from': 'productsubprops', 
          'localField': '_id', 
          'foreignField': 'productMainProp', 
          'as': 'subProps'
        }
      }, {
        '$match': {
          'isNeglected': false
        }
      }, {
        '$unwind': {
          'path': '$subProps'
        }
      }, {
        '$match': {
          'subProps.isNeglected': false
        }
      }, {
        '$group': {
          '_id': '$_id', 
          'nameAr': {
            '$first': '$nameAr'
          }, 
          'nameEn': {
            '$first': '$nameEn'
          }, 
          'isNeglected': {
            '$first': '$isNeglected'
          }, 
          'subProps': {
            '$push': '$subProps'
          }
        }
      }, {
        '$match': {
          '$expr': {
            '$gt': [
              {
                '$size': '$subProps'
              }, 0
            ]
          }
        }
      },
      {
        '$sort': {
          _id: 1
        }
      }
    ]);
}

const addMainProp = async (input) => {
    
    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newMainProp = new ProductMainProp(body)

    newMainProp = await newMainProp.save();

    return newMainProp;
}


const updateMainProp = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedMainProp = await ProductMainProp.findByIdAndUpdate(id, body, {new: true})

    return updatedMainProp;
}


const deleteMainProp = async (input) => {
    let { id } = input.params;
    return await ProductMainProp.findByIdAndDelete(id)
}


module.exports = {
    ProductMainProp,
    getMainProps,
    addMainProp,
    updateMainProp,
    deleteMainProp,
    getAllProps
}


