const { Auth, addAuth, deleteAuth, updateAuth, updateMultiAuth, listAuth,
    getAuth, authrfunc, authnfunc } = require('../models/auth');
const express = require('express');
const router = express.Router();


router.get('/checkAuthr', async (req, res) => {
    let checkAuthr = await authrfunc(req);
    res.send(checkAuthr);
});

router.get('/checkAuthn', async (req, res) => {
    let checkAuthn = await authnfunc(req);
    res.send(checkAuthn);
});

router.get('/', async (req, res) => {
    let auths = await listAuth();
    res.send(auths);
});

router.get('/:id', async (req, res) => {
    let auth = await getAuth(req);
    res.send(auth);
});

router.post('/add', async (req, res) => {
    let newAuth = await addAuth(req);

    if (newAuth.message && newAuth.path && newAuth.type && newAuth.context)
        return res.status(400).send(newAuth.message)

    res.send(newAuth);
});

router.put('/edit/:id', async (req, res) => {
    let updatedAuth = await updateAuth(req);

    if (updatedAuth.message && updatedAuth.path && updatedAuth.type && updatedAuth.context)
        return res.status(400).send(updatedAuth.message)

    res.send(updatedAuth);
});

router.put('/editMulti', async (req, res) => {
    
    let updatedMultiAuth = await updateMultiAuth(req);
   
    if (updatedMultiAuth.message && updatedMultiAuth.path && updatedMultiAuth.type && updatedMultiAuth.context)
        return res.status(400).send(updatedMultiAuth.message)

    res.send(updatedMultiAuth);
});

router.delete('/delete/:id', async (req, res) => {
    let deletedAuth = await deleteAuth(req);
    res.send(deletedAuth);
});


module.exports = router; 