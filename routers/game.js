const express = require('express');
const game = require('../schemas/game');
const gameRouter = express.Router();

gameRouter.get('/new', (req, res) => {
    res.render('pages/game/new');
})

module.exports = gameRouter;