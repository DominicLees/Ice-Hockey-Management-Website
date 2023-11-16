const express = require('express');
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
        date: inputDate
    })

    newGame.save().then(result => {
        res.redirect('/dashboard');
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

module.exports = gameRouter;