const express = require('express');
const gameRouter = express.Router();
const crypto = require('crypto');
const Game = require('../schemas/game');
const Player = require('../schemas/player');

// UTILITY FUNCTIONS

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function ForbiddenError() {
    const error = new Error('Forbidden');
    error.status = 403;
    return error;
}

// MIDDLEWARE

function coachOnly(req, res, next) {
    if (!req.isCoach) {
        next(ForbiddenError());
    }
    next();
}

function playersOnly(req, res, next) {
    if (!req.isPlayer) {
        next(ForbiddenError());
    }
    next();
}

function playerOrCoachOnly(req, res, next) {
    if (!(req.isPlayer || req.isCoach)) {
        next(ForbiddenError());
    }
    next();
}

// ROUTES

gameRouter.get('/new', coachOnly, (req, res) => {
    res.render('pages/game/new');
})

gameRouter.post('/new', coachOnly, (req, res, next) => {
    // Validate Input
    if (req.body.opponent.length == 0) {
        req.session.responses.noOpponent = true;
    } if (req.body.homeOrAway == null) {
        req.session.responses.noHomeOrAway = true;
    }
    // Check date given is in the future
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

// Check that the game for the gameId provided exists
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
        // Add Game title to found game
        req.foundGame.title = result.atHome ? `${req.foundTeam.name} vs ${req.foundGame.opponent}` : `${req.foundGame.opponent} vs ${req.foundTeam.name}`;
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

gameRouter.get('/:gameId/signup', playersOnly, (req, res, next) => {
    // If user is already signed up, do not add them to the list again
    if (req.foundGame.playersSignedUp.some(e => e._id.toString() == req.foundPlayer._id.toString())) { return res.redirect('back'); }

    req.foundGame.playersSignedUp.push(req.foundPlayer._id);
    req.foundGame.save().then(result => {
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId/leave', playersOnly, (req, res, next) => {
    // Remove the user from the list of players signed up
    req.foundGame.playersSignedUp = req.foundGame.playersSignedUp.filter(e => e._id.toString() != req.foundPlayer._id.toString());
    req.foundGame.save().then(result => {
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId/line-builder', coachOnly, (req, res) => {
    // Filter signed up players into skaters and goalies
    const goalies = req.foundGame.playersSignedUp.filter(x => x.positions.includes('G'));
    const players = req.foundGame.playersSignedUp.filter(x => x.positions.length > 1 || !x.positions.includes('G'));

    // Validate user input
    const numOfFSLines = req.query.numOfFSLines == null ? 3 : clamp(req.query.numOfFSLines, 1, 4);
    const numOfPPLines = req.query.numOfPPLines == null ? 2 : clamp(req.query.numOfPPLines, 1, 4);
    const numOfPKLines = req.query.numOfPKLines == null ? 2 : clamp(req.query.numOfPKLines, 1, 4);

    res.render('pages/game/lineBuilder', {
        team: req.foundTeam,
        game: req.foundGame,
        goalies,
        players,
        numOfFSLines,
        numOfPPLines,
        numOfPKLines,
    })
})

gameRouter.post('/:gameId/line-builder/save', coachOnly, (req, res, next) => {
    // Check if the 2 goalies picked are different
    if (req.body.startingGoalie == req.body.backupGoalie) {
        req.session.responses.sameGoalie = true;
    } 
    // Remove all the 'noneSelected' values from the lines
    const pickedPlayers = Object.keys(req.body).reduce((acc, key) => (req.body[key] !== 'noneSelected' && (acc[key] = req.body[key]), acc), {});
    // Get all the players picked for 5 on 5
    const pickedSkaters = Object.fromEntries(Object.entries(pickedPlayers).filter(([key]) => key.includes('line')));
    // Check if any players have been picked multiple times
    if (new Set(Object.values(pickedSkaters)).size !== Object.keys(pickedSkaters).length) {
        req.session.responses.samePlayerMultipleTimes = true;
    }

    if (Object.keys(req.session.responses).length > 0) {
        return res.redirect('back');
    }
    
    // Get the goalies selected, then remove them
    const startingGoalie = pickedPlayers.startingGoalie;
    delete pickedPlayers.startingGoalie;
    const backupGoalie = pickedPlayers.backupGoalie == "noneSelected" ? null : pickedPlayers.backupGoalie;
    delete pickedPlayers.backupGoalie;
    
    // Convert List of picked skaters into postion and player object Id pairs
    let skaters = [];
    for (const [key, value] of Object.entries(pickedPlayers)) {
        skaters.push({
            linePosition: key,
            playerId: value
        })
    }

    // Save the lines to the database
    req.foundGame.lines = {
        startingGoalie,
        backupGoalie,
        skaters
    }
    
    req.foundGame.save().then(result => {
        req.session.responses.linesSaved = true;
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId/lines', playerOrCoachOnly, (req, res, next) => {
    // Check lines have been submitted
    if (req.foundGame.lines == null) {
        return res.redirect(`/team/${req.params.code}/game/${req.params.gameId}`);
    }

    res.render('pages/game/lineViewer', {
        game: req.foundGame
    });
})

module.exports = gameRouter;