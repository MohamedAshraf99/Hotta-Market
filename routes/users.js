const { authnMW, authrMW } = require('../RBAC_Auth/models/auth');
const { User, register, login,
    changePassword, updateUser, resetPassword,
    getUser, getUsers, activate, sendActivationCode } = require('../models/user');
const express = require('express');
const router = express.Router();

const { upload } = require('../services/helper')


router.post('/register', upload.single('avatar'), async (req, res) => {

    req.body = JSON.parse(req.body.data || {});

    req.body.avatar = (!req.file) ? false : `/uploads/${req.file.filename}`;

    let newUser = await register(req);

    if (newUser.message && newUser.path && newUser.type && newUser.context)
        return res.status(400).send(newUser.message)
    else if (typeof newUser == "string")
        return res.status(400).send(newUser)

    res.send(newUser);
});


router.put('/edit/:id', upload.single('avatar'), async (req, res) => {

    req.body = JSON.parse(req.body.data || {});

    if(req.file) req.body.avatar = `/uploads/${req.file.filename}`;

    let updatedUser = await updateUser(req);

    if (updatedUser.message && updatedUser.path && updatedUser.type && updatedUser.context)
        return res.status(400).send(updatedUser.message)

    res.send(updatedUser);
});


router.post('/login', async (req, res) => {

    let loggedUser = await login(req);

    if (loggedUser.message && loggedUser.path && loggedUser.type && loggedUser.context)
        return res.status(400).send(loggedUser.message)

    res.send(loggedUser);
});


router.put('/changePassword', async (req, res) => {

    let user = await changePassword(req);

    if (user.message && user.path && user.type && user.context)
        return res.status(400).send(user.message)

    res.send(user);
});

router.put('/activate', async (req, res) => {

    let user = await activate(req);

    if (user.message && user.path && user.type && user.context)
        return res.status(400).send(user.message)

    res.send(user);
});

router.get('/sendActivationCode/:phone', async (req, res) => {

    let user = await sendActivationCode(req);

    if (user.message && user.path && user.type && user.context)
        return res.status(400).send(user.message)

    res.send(user);
});


router.put('/resetPassword', async (req, res) => {

    let user = await resetPassword(req);

    if (user.message && user.path && user.type && user.context)
        return res.status(400).send(user.message)

    res.send(user);
});


router.get('/getUser/:id', async (req, res) => {

    let user = await getUser(req);

    if (user.message && user.path && user.type && user.context)
        return res.status(400).send(user.message)

    res.send(user);
});

router.get('/getUser/:id', async (req, res) => {

    let user = await getUser(req);

    if (user.message && user.path && user.type && user.context)
        return res.status(400).send(user.message)

    res.send(user);
});


router.get('/', async (req, res) => {

    let users = await getUsers(req);

    if (users.message && users.path && users.type && users.context)
        return res.status(400).send(users.message)

    res.send(users);
});



module.exports = router; 
