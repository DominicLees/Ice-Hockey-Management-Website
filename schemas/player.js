const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', autopopulate: true},
    team: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Team'},
    positions: {type: [String], required: true},
    privacy: {type: String, enum: ['public', 'teamOnly', 'coachOnly'], default: 'teamOnly'},
    games: [{
        game: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Game'},
        goals: {type: Number, default: 0, min: 0},
        assists: {type: Number, default: 0, min: 0},
        pims: {type: Number, default: 0, min: 0}
    }]
})

playerSchema.virtual('totalGames').get(function() {
    return this.games.length;
})

playerSchema.virtual('totalGoals').get(function() {
    let goals = 0;
    this.games.forEach(game => {
        goals += game.goals;
    })
    return goals;
})

playerSchema.virtual('totalAssists').get(function() {
    let assists = 0;
    this.games.forEach(game => {
        assists += game.assists;
    })
    return assists;
})

playerSchema.set('toObject', { virtuals: true });

playerSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Player', playerSchema);