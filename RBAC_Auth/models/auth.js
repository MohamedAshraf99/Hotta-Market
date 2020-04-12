const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');
const { User } = require('../../models/user');
const { Role } = require('./role');


let requestMethods = [
    'GET',
    'POST',
    'DELETE',
    'PUT',
    'HEAD',
    'CONNECT',
    'OPTIONS',
    'TRACE'
].filter((e, i) => i <= 3);  // get only main methods

requestMethodsForSchema = requestMethods.map(method => ({
    [method]: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
}))

let schemaObj = {
    name: {
        type: String,
        unique: true,
        required: true,
        minlength: 3,
    },
    route: {
        type: String,
        unique: true,
        required: true,
        minlength: 3,
    },
    access: {
        type: String,
        enum: ['stop', 'normal', 'owner'],
        default: 'normal'
    },
    dateCreate: {
        type: Date,
        default: Date.now
    },
    dateUpdate: {
        type: Date,
        default: Date.now
    },
}

schemaObj = Object.assign(schemaObj, ...requestMethodsForSchema);

const authSchema = new mongoose.Schema(schemaObj);

authSchema.pre('save', function (next) {
    let thisDoc = this

    requestMethods.map(method => (
        thisDoc[method] = _.uniq(thisDoc[method])
    ))

    next();
});

const Auth = mongoose.model('Auth', authSchema);


const validateAdd = (body) => {
    let schema = {
        name: Joi.string().min(3).required(),
        route: Joi.string().min(3).required(),
        access: Joi.string().optional(),
    };

    requestMethodsForValidate = requestMethods.map(method => ({
        [method]: Joi.array().optional()
    }))

    schema = Object.assign(schema, ...requestMethodsForValidate)

    return Joi.validate(body, schema);
}

const validateUpdate = (body) => {
    let schema = {
        name: Joi.string().min(3).optional(),
        route: Joi.string().min(3).optional(),
        access: Joi.string().optional(),
    };

    requestMethodsForValidate = requestMethods.map(method => ({
        [method]: Joi.array().optional()
    }))

    schema = Object.assign(schema, ...requestMethodsForValidate)

    return Joi.validate(body, schema);
}

const validateMultiUpdate = (body) => {
    let schema = {
        updatedAuths: Joi.array().required(),
    };

    return Joi.validate(body, schema);
}

const listAuth = async (input) => {
    return await Auth.find();
}


const getAuth = async (input) => {
    let { id } = input.params;

    let auth = await Auth.findById(id);

    return auth.toObject()
}


const addAuth = async (input) => {

    let body = input.body;

    const { error } = validateAdd(body);
    if (error) return (error.details[0]);

    let newAuth = new Auth(body)

    newAuth = await newAuth.save();

    return newAuth;
}


const updateAuth = async (input) => {
    let { id } = input.params;

    let body = input.body;

    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);

    let updatedAuth = await Auth.findByIdAndUpdate(id, { ...body }, { new: true }) //{new: true} return updated doc

    return updatedAuth;
}


const updateMultiAuth = async (input) => {

    let { updatedAuths = [] } = input.body;

    let ret = []

    const { error } = validateMultiUpdate(input.body);
    if (error) return (error.details[0]);

    //await Promise.all( --for make array.map on await function
    await Promise.all(
        updatedAuths.map(async updatedAuth => {
            let id = updatedAuth._id,
                bodyAuth = _.omit(updatedAuth, ['_id', 'dateCreate'])

            updatedAuth = await Auth.findByIdAndUpdate(id, bodyAuth, { new: true })

            if (updatedAuth) ret.push(updatedAuth)
        })
    )

    return ret;
}


const deleteAuth = async (input) => {
    let { id } = input.params;
    return await Auth.findByIdAndDelete(id)
}


const authrMW = async (req, res, next) => {

    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied.');

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey')),
            userId = decoded._id,
            user = await User.findById(userId)

        if (!user._id) return res.status(401).send('Access denied.');

        //custom validation
        if (!user.activated || !user.neglected)
            return res.status(401).send('Access denied.');

        const userRole = user.role,
            thisRoute = (req.baseUrl.split('/')[2] /*+ req.path*/),
            thisMethod = req.method.toUpperCase(),
            userRoleInfo = await Role.findById(userRole),
            owner = userRoleInfo.owner,
            auth = await getAuth(input = { params: { route_name: thisRoute } })


        if (
            (auth.access != 'stop' && auth[thisMethod]) &&
            (
                (owner) ||
                (
                    (auth.access == 'normal') &&
                    (
                        // (!auth[thisMethod].length) ||
                        (auth[thisMethod].map(g => g.toString()).includes(userRole.toString()))
                    )
                )
            )

        ) {
            req.user = {_id: user._id}
            next();
        }


        return res.status(401).send('Access denied.');
    }
    catch (ex) {
        return res.status(400).send('Invalid token');
    }

}

const authnMW = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied.');

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey')),
            userId = decoded._id,
            user = await User.findById(userId)

        if (!user._id) return res.status(401).send('Access denied.');

        //custom validation
        if (!user.isActivated || user.isNeglected)
            return res.status(401).send('Access denied.');

        req.user = {_id: user._id}
            
        next();
    }
    catch (ex) {
        res.status(400).send('Invalid token');
    }

}

const authrfunc = async (input) => {
    const token = input.header('Authorization');
    if (!token) return false;

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey')),
            user = await User.findById(decoded._id)

        if (!user._id) return false;

        //custom validation
        if(!user.activated || !user.neglected) return false;

        const userRole = user.role,
            userRoleInfo = await Role.findById(userRole),
            role = userRoleInfo._id,
            owner = userRoleInfo.owner,
            auths = await Auth.find(),
            returnedAuths = {};

        if (auths)
            auths.map(auth => {
                let temp = {};

                Object.keys(auth.toObject()).map(attr => {
                    if (Array.isArray(auth[attr]))
                        temp[attr] =
                            (
                                (auth.access != 'stop' && auth[attr]) &&
                                (
                                    (owner) ||
                                    (
                                        (auth.access == 'normal') &&
                                        (
                                            // (!auth[attr].length) ||
                                            (auth[attr].map(g => g.toString()).includes(role.toString()))
                                        )
                                    )
                                )
                            ) ? true : false
                })

                returnedAuths[auth.route] = temp
            })

        return returnedAuths;
    }
    catch (ex) { return false }

}

const authnfunc = async (input) => {

    const token = input.header('Authorization');
    if (!token) return false;

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey')),
            userId = decoded._id,
            user = await User.findById(userId)

        if (!user._id) return false;

        //custom validation
        if (!user.activated || !user.neglected) return false;

        return true
    }
    catch (ex) { return false }

}

const testableAuthnMW = (req,res,next) => {
    // _id => 5e5ec91519c4fe411c596cd2
    let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTVlYzkxNTE5YzRmZTQxMWM1OTZjZDIiLCJpYXQiOjE1ODMyNzY0NDR9.oUznYWZwXAhQB2gkgIpZzyuzZg06RwGrWGAH2IT57Ns"
    const decoded = jwt.verify(token, config.get('jwtPrivateKey')),
    _id = decoded._id;

    req.user = {
        _id
    }

    next();
}

//used in app.js
const seedAuths = async (routes = []) => {
    let existRoutesNames = await Auth.find({}, { name: 1 })

    if (existRoutesNames) {

        routes = _.difference(
            routes,
            existRoutesNames.map(e => e.name)
        );

        routes = routes.map(route => ({
            name: route,
            route,
        }))

        if (routes.length)
            Auth.insertMany(routes);
    }
}

//==============assign routes to auth  --put in app.js===============
// let routes = _.uniq(listEndpoints(app).map(p=>p.path.split('/')[2]));
// seedAuths(routes)
//==============================


module.exports = {
    Auth,
    listAuth,
    getAuth,
    addAuth,
    updateAuth,
    updateMultiAuth,
    deleteAuth,
    authrMW,
    authnMW,
    testableAuthnMW,
    authrfunc,
    authnfunc,
    seedAuths
}