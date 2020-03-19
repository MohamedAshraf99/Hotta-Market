const Joi = require('joi');
const mongoose = require('mongoose');



const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        minlength: 3,
    },
    owner: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    },
    dateUpdate: {
        type: Date,
        default: Date.now
    },
});


const Role = mongoose.model('Role', roleSchema);

const validateAdd = (body) => {
    let schema = {
        name: Joi.string().min(3).required(),
        owner: Joi.bool().optional()
    };

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        name: Joi.string().min(3).optional(),
        owner: Joi.bool().optional()
    };

    return Joi.validate(body, schema);
}


const getRoles = async (input) => {
    return await Role.find();
}


const addRole = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newRole = new Role(body)

    newRole = await newRole.save();

    return newRole;
}


const updateRole = async (input) => {

    let {id} = input.params;
    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedRole = await Role.findByIdAndUpdate(id, {...body, dateUpdate: Date.now()}, {new: true})

    return updatedRole;
}


const deleteRole = async (input) => {
    let { id } = input.params;
    return await Role.findByIdAndDelete(id)
}


// moved to seedAdmin in user

// async function seedAdminRole() {
//     let count = await Role.find().count();
  
//     if (!count) {
//       console.log('creating (admin) role')
//       let adminRoleData = {
//           name: 'admin',
//           owner: true,
//       }

//       let adminRole = new Role(adminRoleData)

//       await adminRole.save()
//     }
  
  
//   }
//   seedAdminRole();


module.exports = {
    Role,
    getRoles,
    addRole,
    updateRole,
    deleteRole
}