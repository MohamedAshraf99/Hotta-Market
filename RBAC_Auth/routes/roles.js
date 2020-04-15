const { Role, addRole, deleteRole, getRoles, updateRole } = require('../models/role');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    let roles = await getRoles();
    res.send(roles);
});


//parameter ended with ? mean :: optional param
router.post('/add', async (req, res) => {
    let newRole = await addRole(req);
    
    if (newRole.message && newRole.path && newRole.type && newRole.context)
        return res.status(400).send(newRole.message)

    res.send(newRole);
});

router.put('/edit/:id', async (req, res) => {
    let updatedRole = await updateRole(req);

    if(updatedRole.message && updatedRole.path && updatedRole.type && updatedRole.context)
        return res.status(400).send(updatedRole.message)

    res.send(updatedRole);
});

router.delete('/delete/:id', async (req, res) => {
    let deletedRole = await deleteRole(req);
    res.send(deletedRole);
});



module.exports = router; 