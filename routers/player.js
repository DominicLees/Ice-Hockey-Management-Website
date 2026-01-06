const express = require('express');
const playerRouter = express.Router();
const mongoose = require('mongoose');
const forbiddenError = require('./../functions/forbiddenError');
const Player = require('./../schemas/player');

playerRouter.use('/:id', (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.redirect('/404');
    }

    Player.findById(req.params.id).populate('team').populate({
        path: 'games',
        populate: {
            path: 'game'
        }
    }).then(result => {
        if (result == null) {
            return res.redirect('/404');
        }
        req.foundPlayer = result;
        next();
    }).catch(error => {
        next(error);
    })
})

playerRouter.get('/:id', (req, res, next) => {
    // Check user has permission to view this page
    const isCoach = req.foundPlayer.team.coach == req.session.account._id;
    if (!isCoach && req.foundPlayer.privacy == 'coachOnly') {
        return next(forbiddenError());
    }
    res.render('playerProfile', {player: req.foundPlayer});
})

playerRouter.post('/:id/update', (req, res, next) => {
    // Check user trying to update settings owns this player profile
    if (req.foundPlayer.user._id != req.session.account._id) {
        return next(forbiddenError());
    }

    // Update privacy settings in database
    req.foundPlayer.privacy = req.body.privacy;
    req.foundPlayer.save().then(() => {
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

module.exports = playerRouter;