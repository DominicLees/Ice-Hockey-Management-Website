const express = require('express');
const crypto = require('crypto');
const gameRouter = express.Router();
const Game = require('../schemas/game');

gameRouter.get('/new', (req, res) => {
    res.render('pages/game/new');
})

gameRouter.post('/new', (req, res) => {
    // Validate Input
    if (req.body.opponent.length == 0) {
        req.session.responses.noOpponent = true;
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
        date: inputDate,
        gameId: crypto.randomBytes(3).toString('hex')
    })

    newGame.save().then(result => {
        res.redirect('/dashboard');
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

gameRouter.use(['/:gameId'], (req, res, next) => {
    Game.findOne({gameId: req.query.gameId}).populate('playersSignedUp').then(result => {
        if (result == null) {
            return res.status(404).send();
        }
        req.foundGame = result;
        next();
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

gameRouter.get('/:gameId', (req, res) => {
    res.render('gamePage', {
        game: req.foundGame,
        team: req.foundTeam,
    })
})

module.exports = gameRouter;