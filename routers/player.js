const express = require('express');
const playerRouter = express.Router();
const Player = require('./../schemas/player');

playerRouter.get('/:id', (req, res, next) => {
    Player.findById(req.params.id).populate('team').then(result => {
        if (result == null) {
            res.redirect('/404');
        }
        res.render('playerProfile', {player: result})
    }).catch(error => {
        next(error);
    })
})

module.exports = playerRouter;