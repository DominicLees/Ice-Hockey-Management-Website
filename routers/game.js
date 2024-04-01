const express = require('express');
const gameRouter = express.Router({ mergeParams: true });
const crypto = require('crypto');
const Game = require('../schemas/game');
const Player = require('../schemas/player');

// UTILITY FUNCTIONS

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const calcLineCount = (prefix, skaters) => {
    let count = 0;
    while (Object.keys(skaters).some(key => key.startsWith(prefix + (count + 1)))) {
        count++;
    }
    return count;
};

// MIDDLEWARE

const coachOnly = require('./../middleware/coachOnly');
const playersOnly = require('./../middleware/playersOnly');
const playerOrCoachOnly = require('./../middleware/playerOrCoachOnly');

function linesRequired(req, res, next) {
    if (req.foundGame.linesSubmitted == false) {
        return res.redirect(`/team/${req.params.code}/game/${req.params.gameId}`);
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
    } else if (req.body.homeOrAway == 'away' && req.body.location.length == 0) {
        req.session.responses.noLocation = true;
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
        atHome: req.body.homeOrAway == 'home',
        location: req.body.homeOrAway == 'home' ? req.foundTeam.location : req.body.location,
        date: inputDate,
        gameId: crypto.randomBytes(3).toString('hex')
    });

    newGame.save().then(result => {
        res.redirect(`/team/${req.foundTeam.code}/game/${result.gameId}`);
    }).catch(error => {
        next(error);
    })
})

// Check that the game for the gameId provided exists
gameRouter.use(['/:gameId'], (req, res, next) => {
    // Find the user data for all of the players that have signed up or rejected the game
    Game.findOne({gameId: req.params.gameId}).populate({
        path: 'playersSignedUp',
        populate: {
            path: 'user'
        }
    }).populate({
        path: 'playersRejected',
        populate: {
            path: 'user'
        }
    }).then(foundGame => {
        if (foundGame == null) {
            return res.redirect('/404');
        }
        req.foundGame = foundGame;
        res.locals.game = foundGame;
        // Find the user's player profile for this team
        return Player.findOne({user: req.session.account._id, team: foundGame.team});
    }).then(foundPlayer => {
        req.foundPlayer = foundPlayer;
        // Find all players who haven't responded to the game
        return Player.find({_id: {$nin: req.foundGame.playersRejected.concat(req.foundGame.playersSignedUp)}, team: req.foundGame.team})
    }).then(playersUnanswered => {
        res.locals.playersUnanswered = playersUnanswered;
        next();
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId', playerOrCoachOnly, (req, res) => {
    res.render('pages/game/gamePage', {
        player: req.foundPlayer,
        isCoach: req.isCoach,
        isPlayer: req.isPlayer
    })
})

// Players can't change their availability once the lines have been submitted
gameRouter.use(['/:gameId/signup', '/:gameId/reject'], playersOnly, (req, res, next) => {
    if (req.foundGame.linesSubmitted) {
        res.redirect('back');
    }
    next();
})

// Handles the user signing up to a game
gameRouter.get('/:gameId/signup', (req, res, next) => {
    // If the user is already signed up, do not add them to the list again
    if (req.foundGame.playersSignedUp.some(e => e._id.toString() == req.foundPlayer._id.toString())) { return res.redirect('back'); }
    // If the user is on the list of players who rejected the game, remove them from it
    req.foundGame.playersRejected = req.foundGame.playersRejected.filter(e => e._id.toString() != req.foundPlayer._id.toString());

    req.foundGame.playersSignedUp.push(req.foundPlayer._id);
    req.foundGame.save().then(result => {
        res.redirect('back');
    }).catch(error => {
        next(error);
    })
})

// Handles the user rejecting a game
gameRouter.get('/:gameId/reject', (req, res, next) => {
    // If the user has already rejected the game, do not add them to the list again
    if (req.foundGame.playersRejected.some(e => e._id.toString() == req.foundPlayer._id.toString())) { return res.redirect('back'); }
    // Remove the user from the list of players signed up and add them to the rejected list
    req.foundGame.playersSignedUp = req.foundGame.playersSignedUp.filter(e => e._id.toString() != req.foundPlayer._id.toString());
    req.foundGame.playersRejected.push(req.foundPlayer._id);
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
    const numOfPPLines = req.query.numOfPPLines == null ? 1 : clamp(req.query.numOfPPLines, 0, 4);
    const numOfPKLines = req.query.numOfPKLines == null ? 1 : clamp(req.query.numOfPKLines, 0, 4);

    res.render('pages/game/lineBuilder', {
        goalies,
        players,
        numOfFSLines,
        numOfPPLines,
        numOfPKLines
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
    let skaters = Object.entries(pickedPlayers).map(([key, value]) => ({
        linePosition: key,
        playerId: value
    }));

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

// Break the lines down into an easier to use format for displaying
gameRouter.use(['/:gameId/lines', '/:gameId/summary', '/:gameId/result', '/:gameId/gamesheet'], linesRequired, (req, res, next) => {
    // Take the list of skaters and convert it into line position : name pairs
    res.locals.skaters = req.foundGame.toObject().lines.skaters.reduce((accumulator, currentValue) => {
        // Get the line position and set it as the key
        const { linePosition, ...rest } = currentValue;
        // Only get the name of the player as all the other data is redundant
        accumulator[linePosition] = rest.playerId.user.name;
        return accumulator;
    }, {});
    next();
})

// Calculate how many of each type of line there is
gameRouter.use(['/:gameId/lines', '/:gameId/summary'], (req, res, next) => {
    res.locals.numOfFSLines = calcLineCount('line', res.locals.skaters);
    res.locals.numOfPPLines = calcLineCount('PP', res.locals.skaters);
    res.locals.numOfPKLines = calcLineCount('PK', res.locals.skaters);
    next();
})

// Shows the user the lines in full
gameRouter.get('/:gameId/lines', playerOrCoachOnly, (req, res) => {
    res.render('pages/game/lineViewer', {isPlayer: req.isPlayer});
})

// Shows the user a summary of the lines, where they are playing, who they are playing with etc
gameRouter.get('/:gameId/summary', playersOnly, (req, res) => {
    // Get the list of positions the player is playing in
    let positions = Object.entries(res.locals.skaters)
    .filter(([position, name]) => name === req.session.account.name)
    .map(([position]) => position);

    res.render('pages/game/summary', {
        isGoalie: req.foundGame.lines.startingGoalie.user.name == req.session.account.name || (req.foundGame.lines.backupGoalie && req.foundGame.lines.backupGoalie.user.name == req.session.account.name),
        positions
    });
})

// The player is checked if they are the coach for this route here, to save getting the list of skaters if they are not
gameRouter.use('/:gameId/result', coachOnly, (req, res, next) => {
    // If the result for this game has already been submitted, prevent the user from submitting another
    if (req.foundGame.resultSubmitted) {
        return res.redirect(`/team/${req.params.code}/game/${req.params.gameId}/gamesheet`);
    }
    next();
});

// Gets the list of player document objects for those who played
gameRouter.use(['/:gameId/result', '/:gameId/gamesheet'], (req, res, next) => {
    // Get the goalies
    req.players = [req.foundGame.lines.startingGoalie];
    if (req.foundGame.lines.backupGoalie) req.players.push(req.foundGame.lines.backupGoalie);
    // Find all player profiles of all the skaters who played by comparing the lines to the list of players who initially signed up to the game
    req.foundGame.playersSignedUp.forEach(player => {
        if (Object.values(res.locals.skaters).includes(player.user.name)) {
            req.players.push(player);
        }
    });
    next();
})

gameRouter.get('/:gameId/result', (req, res) => {
    res.render('pages/game/result', {players: req.players});
})

// Save the game result to the database
gameRouter.post('/:gameId/result', (req, res, next) => {
    // Add each player's stats for the game to their list of game results
    req.players.forEach(player => {
        player.games.push({
            game: req.foundGame._id,
            goals: req.body[player._id+'-goals'],
            assists: req.body[player._id+'-assists'],
            pims: req.body[player._id+'-pims']
        })
    })
    Player.bulkSave(req.players).then(() => {
        // Save the score for the game
        req.foundGame.result.teamGoals = req.body.teamGoals;
        req.foundGame.result.opponentGoals = req.body.opponentGoals;
        return req.foundGame.save();
    }).then(() => {
        return res.redirect(`/team/${req.params.code}/game/${req.params.gameId}`);
    }).catch(error => {
        next(error);
    })
})

gameRouter.get('/:gameId/gamesheet', (req, res) => {
    if (!req.foundGame.resultSubmitted) {
        return res.redirect(`/team/${req.params.code}/game/${req.params.gameId}`);
    }
    res.render('pages/game/gamesheet', {players: req.players});
})

module.exports = gameRouter;