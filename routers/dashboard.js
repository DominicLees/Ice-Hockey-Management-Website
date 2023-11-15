const express = require('express');
const dashRouter = express.Router();
const Player = require('./../schemas/player');

dashRouter.get('/', (req, res) => {
    Player.find({user: req.session.account._id}).populate('team').then(result => {
        res.render('dashboard', {
            // Get list of team's user plays for from list of player profiles
            teams: result.map(player => player.team) 
        })
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

module.exports = dashRouter;