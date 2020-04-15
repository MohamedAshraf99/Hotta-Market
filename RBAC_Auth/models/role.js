const Joi = require('joi');
const mongoose = require('mongoose');
const {User} = require('../../models/user')



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
    editableName: {
        type: Boolean,
        default: true,
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


async function seedNonEditableNamedRolesAndAdminRoleAndAdminUser(constRoles) {

    let seedAdminRole = async () => {
        let roles = await Role.find({}, { name: 1 });

        if (!roles.length) {

            //----------assign users const roles with non editableName----------
            let nonEditableNameRoles = [];
            await Promise.all(
                constRoles.map(async (roleName, ind) => {
                    let roleData = {
                        name: roleName,
                        owner: ind == 0,    //first role is owner
                        editableName: false,
                    }

                    let newRole = await Role.create(roleData)

                    if (newRole) nonEditableNameRoles.push(newRole)
                })
            )
            //----------end assign users const roles with non editableName----------


            return nonEditableNameRoles[0]
        }

        return {}

    }

    let count = await User.find({ type: 'admin' }).count();

    let adminRole = await seedAdminRole();

    if (!count && adminRole._id) {
        console.log('creating adminUser Now')
        let userAdmin = {
            phone: '+966admin',
            password: await getHashPassword('123456'),
            isAdmin: true,
        }
        User.insertMany([userAdmin]);
    }

}
seedNonEditableNamedRolesAndAdminRoleAndAdminUser(['admin', 'client', 'vendor', 'productiveFamily']);



module.exports = {
    Role,
    getRoles,
    addRole,
    updateRole,
    deleteRole
}