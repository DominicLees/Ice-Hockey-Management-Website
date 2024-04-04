const express = require('express');
const teamRouter = express.Router();
const crypto = require('crypto');
const Team = require('./../schemas/team');
const Player = require('./../schemas/player');
const Game = require('./../schemas/game');

const coachOnly = require('./../middleware/coachOnly');
const playersOnly = require('./../middleware/playersOnly');
const playerOrCoachOnly = require('./../middleware/playerOrCoachOnly');

teamRouter.get('/new', (req, res) => {
    res.render('pages/team/new');
})

teamRouter.post('/new', (req, res, next) => {
    // Validate input
    if (req.body.name.length == 0) {
        req.session.responses.noTeamName = true;
    } if (req.body.location.length == 0) {
        req.session.responses.noLocation = true;
    }

    // Invalid details given, return to new team page
    if (Object.keys(req.session.responses).length > 0) {
        return res.redirect('back');
    }

    const code = crypto.randomBytes(3).toString('hex');

    // Create new team
    const newTeam = new Team({
        name: req.body.name,
        coach: req.session.account._id,
        location: req.body.location,
        code: code
    })

    newTeam.save().then(result => {
        res.redirect('/team/' + code);
    }).catch(error => {
        next(error);
    })
})

// Check for all routes that use a team code, that the team code is valid
teamRouter.use(['/join/:code', '/:code', '/:code/update-profile'], (req, res, next) => {
    Team.findOne({code: req.params.code}).populate('coach').then(result => {
        if (result == null) { return; }
        // Save data for later so we don't have to query for it again
        req.foundTeam = result;
        res.locals.team = result;
        return Player.find({team: req.foundTeam._id}).lean().populate('user');
    }).then(result => {
        req.foundPlayers = result;
    }).then(() => {
        if (req.foundTeam == null) {
            return res.redirect('/404');
        }
        next();
    }).catch(error => {
        next(error);
    })
})

// Prevent users from joining team they are already apart of
teamRouter.use('/join/:code', (req, res, next) => {
    if (req.foundPlayers.some(player => {return player.user._id.equals(req.session.account._id)})) {
        return res.redirect('/dashboard');
    }
    next();
})

teamRouter.use('/:code/update-profile', (req, res, next) => {
    res.locals.player = req.foundPlayers.find(player => {return player.user._id.equals(req.session.account._id)});
    if (res.locals.player == null) {
        res.redirect('back');
    }
    next();
})

teamRouter.get('/:code/update-profile', (req, res) => {
    res.render('pages/team/updateProfile');
})

teamRouter.use(['/join/:code', '/:code/update-profile'], (req, res, next) => {
    // Validate user input
    if (req.body.positions == null) {
        req.session.responses.noPositionsSelected = true;
        return res.redirect(req.originalUrl);
    }
    next();
})

teamRouter.post('/join/:code', (req, res, next) => {
    // Save player profile to DB
    const newPlayer = new Player({
        user: req.session.account._id,
        team: req.foundTeam._id,
        positions: req.body.positions
    })
    
    newPlayer.save().then(result => {
        res.redirect('/dashboard');
    }).catch(error => {
        next(error);
    });

})

teamRouter.post('/:code/update-profile', (req, res, next) => {
    Player.updateOne({_id: res.locals.player._id}, {positions: req.body.positions}).then(() => {
        res.redirect('/dashboard');
    }).catch(error => {
        next(error);
    })
})

teamRouter.use('/:code', (req, res, next) => {
    if (req.foundTeam.coach._id == req.session.account._id) { 
        req.isCoach = true; 
    } if (req.foundPlayers && req.foundPlayers.filter(player => player.user._id == req.session.account._id).length > 0) {
        req.isPlayer = true; 
    }
    next();
})

teamRouter.get('/:code', playerOrCoachOnly, (req, res, next) => {
    // Find all the games this team is playing in the future
    Game.find({team: req.foundTeam._id, date: {$gt: new Date()}}).sort({date: 1}).lean({virtuals: true}).then(result => {
        res.locals.games = result;

        // Get the last 5 results
        return Game.find({team: req.foundTeam._id, date: {$lt: new Date()}}).sort({date: 1}).limit(5).lean({virtuals: true});
    }).then(result => {
        res.render('pages/team/teamProfile', {
            players: req.foundPlayers,
            isCoach: req.isCoach,
            isPlayer: req.isPlayer,
            results: result
        })
    }).catch(error => {
        next(error);
    })
})

teamRouter.get('/:code/leave', playersOnly, (req, res, next) => {
    Player.deleteOne({team: req.foundTeam._id, user: req.session.account._id}).then(() => {
        req.session.responses.leaveTeamSuccessful = true;
        res.redirect('/dashboard');
    }).catch(error => {
        next(error);
    })
})

teamRouter.get('/:code/remove/:playerId', playersOnly, (req, res, next) => {
    Player.deleteOne({_id: req.params.playerId}).then(() => {
        req.session.responses.playerRemoveSuccessful = true;
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

teamRouter.get('/:code/delete', coachOnly, (req, res, next) => {
    // Delete player profiles
    Player.deleteMany({team: req.foundTeam._id}).then(() => {
        // Delete Team
        return Team.deleteOne({_id: req.foundTeam._id});
    }).then(() => {
        req.session.responses.teamDeleteSuccessful = true;
        res.redirect('/dashboard');
    }).catch(error => {
        next(error);
    })
})

module.exports = teamRouter;