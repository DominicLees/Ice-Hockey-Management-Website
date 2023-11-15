const express = require('express');
const crypto = require('crypto');
const teamRouter = express.Router();
const Team = require('./../schemas/team');
const Player = require('./../schemas/player');

teamRouter.get('/new', (req, res) => {
    res.render('pages/team/new');
})

teamRouter.post('/new', (req, res) => {
    // Validate input
    if (req.body.name.length == 0) {
        req.session.responses.noTeamName = true;
        return res.redirect('/new');
    }

    const code = crypto.randomBytes(3).toString('hex');

    // Create new team
    const newTeam = new Team({
        name: req.body.name,
        coach: req.session.account._id,
        code: code
    })

    newTeam.save().then(result => {
        res.redirect('/team/' + code);
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

// Check for all routes that use a team code, that the team code is valid
teamRouter.use(['/join/:code', '/:code'], (req, res, next) => {
    Team.findOne({code: req.params.code}).populate('coach').then(result => {
        if (result == null) {
            return res.status(404).send();
        }

        // Save data for later so we don't have to query for it again
        req.foundTeam = result;
        next();
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

teamRouter.get('/join/:code', (req, res) => {
    res.render('pages/team/join', {
        team: req.foundTeam
    })
})

teamRouter.post('/join/:code', (req, res) => {
    // Validate user input
    if (req.body.positions == null) {
        req.session.responses.noPositionsSelected = true;
        return res.redirect(req.originalUrl);
    }

    // Save player profile to DB
    const newPlayer = new Player({
        user: req.session.account._id,
        team: req.foundTeam._id,
        positions: req.body.positions
    })
    
    newPlayer.save().then(result => {
        res.redirect('/dashboard')
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    });

})

teamRouter.get('/:code', (req, res) => {
    Player.find({team: req.foundTeam._id}).populate('user').then(result => {
        let players;
        // If the user is the coach of the team or is a player on the team, show them the normal team profile
        if (req.foundTeam.coach._id == req.session.account._id || result.filter(player => player.user._id == req.session.account._id).length > 0) {
            players = result;
        }

        res.render('pages/team/teamProfile', {
            team: req.foundTeam,
            players: players
        })
    })
})

module.exports = teamRouter;