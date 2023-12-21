const express = require('express');
const dashRouter = express.Router();
const Player = require('./../schemas/player');
const Team = require('./../schemas/team');
const Game = require('./../schemas/game');

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
        // Remove duplicates
        teams = teams.filter((v,i,a)=>a.findIndex(v2=>(v2.code===v.code))===i)
        // Sort the lists alphabetically
        teams.sort((a, b) => a.name - b.name);
        // Take the _ids from the teams and put them into an array
        const teamIds = teams.map(x => x._id);
        // Find all the future games for the teams the user is involved with
        return Game.find({team: {$in: teamIds}, date: {$gt: new Date()}}).lean().populate('team');
    }).then(result => {
        res.render('dashboard', {
            teams: teams,
            games: result
        })
    }).catch(error => {
        next(error);
    })
})
module.exports = dashRouter;