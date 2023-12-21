const express = require('express');
const dashRouter = express.Router();
const Player = require('./../schemas/player');
const Team = require('./../schemas/team');

dashRouter.get('/', (req, res, next) => {
    let teams;
    // Get list of teams user plays for from list of player profiles
    Player.find({user: req.session.account._id}).lean().populate('team').then(result => {
        teams = result.map(player => player.team);
        // Get list of teams the user is the coach for 
        return Team.find({coach: req.session.account._id}).lean();
    }).then(result => {
        // Combine the 2 lists of teams
        teams = teams.concat(result);
        // Remove duplicates
        teams = teams.filter((v, i, a) => a.findIndex(v2 => (v2.code === v.code)) === i);
        // Sort the lists alphabetically
        teams.sort((a, b) => a.name - b.name);
        res.render('dashboard', {teams});
    }).catch(error => {
        next(error);
    })
})

module.exports = dashRouter;