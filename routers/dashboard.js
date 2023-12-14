const express = require('express');
const dashRouter = express.Router();
const Player = require('./../schemas/player');
const Team = require('./../schemas/team');

dashRouter.get('/', (req, res, next) => {
    let teams;
    // Get list of teams user plays for from list of player profiles
    Player.find({user: req.session.account._id}).populate('team').then(result => {
        teams = result.map(player => player.team)
        // Get list of teams the user is the coach for 
        return Team.find({coach: req.session.account._id}).lean()
    }).then(result => {
        // Combine the 2 list of teams
        teams = teams.concat(result);
        // Sort the lists alphabetically
        teams.sort((a, b) => a.name - b.name);
        res.render('dashboard', {
            teams: teams
        })
    }).catch(error => {
        next(error);
    })
})
module.exports = dashRouter;