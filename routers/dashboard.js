const express = require('express');
const dashRouter = express.Router();
const Player = require('./../schemas/player');
const Team = require('./../schemas/team');
const Game = require('./../schemas/game');

dashRouter.use(['/dashboard', '/schedule'], (req, res, next) => {
    let teams;
    // Get list of teams user plays for from list of player profiles
    Player.find({user: req.session.account._id}).lean().populate('team').then(result => {
        res.locals.playerProfiles = result;
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
        res.locals.teams = teams;
        // Take the _ids from the teams and put them into an array
        req.teamIds = teams.map(x => x._id);
        next();
    }).catch(error => {
        next(error);
    })
})

dashRouter.get('/dashboard', (req, res, next) => {
    Game.find({team: {$in: req.teamIds}, date: {$gt: new Date()}}).sort({date: 1}).limit(10).populate('team').then(result => {
        res.render('dashboard', {
            games: result
        });
    }).catch(error => {
        next(error);
    })
})

dashRouter.get('/schedule', (req, res, next) => {
    const teamIds = (req.query.teamFilter == null || req.query.teamFilter == 'all') ? req.teamIds : [req.query.teamFilter];
    const dateFilter = req.query.dateFilter == 'past' ? {$lte: new Date()} : {$gte: new Date()};
    Game.find({team: {$in: teamIds}, date: dateFilter}).sort({date: 1}).populate('team').then(result => {
        res.render('schedule', {
            games: result
        });
    }).catch(error => {
        next(error);
    })
})

module.exports = dashRouter;