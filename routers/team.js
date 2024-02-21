const express = require('express');
const teamRouter = express.Router();
const crypto = require('crypto');
const Team = require('./../schemas/team');
const Player = require('./../schemas/player');
const Game = require('./../schemas/game');

const coachOnly = require('./../middleware/coachOnly');
const playerOrCoachOnly = require('./../middleware/playerOrCoachOnly');

teamRouter.get('/new', (req, res) => {
    res.render('pages/team/new');
})

teamRouter.post('/new', (req, res, next) => {
    // Validate input
    if (req.body.name.length == 0) {
        req.session.responses.noTeamName = true;
        return res.redirect('/new');
    }

    const code = crypto.randomBytes(3).toString('hex');

    // Create new team
    const newTeam = new Team({
        name: req.body.name,
        coach: req.session.account._id,
        code: code
    })

    newTeam.save().then(result => {
        res.redirect('/team/' + code);
    }).catch(error => {
        next(error);
    })
})

// Check for all routes that use a team code, that the team code is valid
teamRouter.use(['/join/:code', '/:code'], (req, res, next) => {
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

teamRouter.get('/join/:code', (req, res) => {
    res.render('pages/team/join');
})

teamRouter.post('/join/:code', (req, res, next) => {
    // Validate user input
    if (req.body.positions == null) {
        req.session.responses.noPositionsSelected = true;
        return res.redirect(req.originalUrl);
    }

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

teamRouter.use('/:code', (req, res, next) => {
    if (req.foundTeam.coach._id == req.session.account._id) { 
        req.isCoach = true; 
    } if (req.foundPlayers && req.foundPlayers.filter(player => player.user._id == req.session.account._id).length > 0) {
        req.isPlayer = true; 
    }
    
    // Next find all the games this team is playing
    Game.find({team: req.foundTeam._id}).lean().then(result => {
        res.locals.games = result;
        next();
    }).catch(error => {
        next(error);
    })
})

teamRouter.get('/:code', playerOrCoachOnly, (req, res) => {
    res.render('pages/team/teamProfile', {
        players: req.foundPlayers,
        isCoach: req.isCoach,
        playerSort: req.query.playerSort,
        playerFilter: req.query.playerFilter
    })
})

teamRouter.get('/:code/delete', coachOnly, (req, res, next) => {
    Team.deleteOne({_id: req.foundTeam._id}).then(() => {
        req.session.responses.teamDeleteSuccessful = true;
        res.redirect('/dashboard');
    }).catch(error => {
        next(error);
    })
})

module.exports = teamRouter;