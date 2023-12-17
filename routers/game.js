const express = require('express');
const crypto = require('crypto');
const gameRouter = express.Router();
const Game = require('../schemas/game');
const Player = require('../schemas/player');

gameRouter.get('/new', (req, res) => {
    res.render('pages/game/new');
})

gameRouter.post('/new', (req, res, next) => {
    // Validate Input
    if (req.body.opponent.length == 0) {
        req.session.responses.noOpponent = true;
    } if (req.body.homeOrAway == null) {
        req.session.responses.noHomeOrAway = true;
    }
    const inputDate = new Date(req.body.date);
    if (isNaN(inputDate) || inputDate < new Date()) {
        req.session.responses.pastDate = true;
    }

    if (Object.keys(req.session.responses).length > 0) {
        return res.redirect(req.originalUrl);
    }


    // Add game to database
    const newGame = new Game({
        team: req.foundTeam._id,
        opponent: req.body.opponent,
        atHome: req.body.homeOrAway == "home",
        date: inputDate,
        gameId: crypto.randomBytes(3).toString('hex')
    })

    newGame.save().then(result => {
        res.redirect('/dashboard');
    }).catch(error => {
        next(error);
    })
})

gameRouter.use(['/:gameId'], (req, res, next) => {
    // Find the user data for all of the players that have signed up
    Game.findOne({gameId: req.params.gameId}).populate({
        path: 'playersSignedUp',
        populate: {
            path: 'user'
        }
    }).then(result => {
        if (result == null) {
            return res.redirect('/404');
        }
        req.foundGame = result;
        // Find the player profile for the user for this team
        return Player.findOne({user: req.session.account._id, team: result.team})
    }).then(result => {
        req.foundPlayer = result;
        next();
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId', (req, res) => {
    res.render('pages/game/gamePage', {
        game: req.foundGame,
        team: req.foundTeam,
        player: req.foundPlayer,
        isCoach: req.isCoach,
        isPlayer: req.isPlayer
    })
})

gameRouter.get('/:gameId/line-builder', (req, res) => {
    if (!req.isCoach) {
        // Change this to throw a 403 error later
        return res.redirect('back');
    }

    res.render('pages/game/lineBuilder', {
        team: req.foundTeam,
        game: req.foundGame
    })
})

gameRouter.get('/:gameId/signup', (req, res, next) => {
    // If user is already signed up, do not add them to the list again
    if (req.foundGame.playersSignedUp.some(e => e._id.toString() == req.foundPlayer._id.toString())) { return res.redirect('./') }
    req.foundGame.playersSignedUp.push(req.foundPlayer._id);
    req.foundGame.save().then(result => {
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId/leave', (req, res, next) => {
    req.foundGame.playersSignedUp = req.foundGame.playersSignedUp.filter(e => e._id.toString() != req.foundPlayer._id.toString());
    req.foundGame.save().then(result => {
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

module.exports = gameRouter;