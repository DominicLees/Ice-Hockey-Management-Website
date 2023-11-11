const express = require('express');
const crypto = require('crypto');
const teamRouter = express.Router();
const Team = require('./../schemas/team');

teamRouter.get('/new', (req, res) => {
    res.render('pages/team/new');
})

teamRouter.post('/new', (req, res) => {
    // validate input
    if (req.body.name.length == 0) {
        req.session.responses.noTeamName = true;
        return res.redirect('/new');
    }

    const code = crypto.randomBytes(3).toString('hex');

    // create new team
    const newTeam = new Team({
        name: req.body.name,
        coach: req.session.account._id,
        code: code
    })

    newTeam.save().then(result => {
        res.redirect('/' + code);
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

module.exports = teamRouter;