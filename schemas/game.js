const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    team: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Team', autopopulate: true},
    opponent: {type: String, required: true},
    atHome: {type: Boolean, required: true},
    location: {type: String, required: true},
    date: {type: Date, required: true},
    playersSignedUp: {type: [mongoose.Schema.Types.ObjectId], ref: 'Player'},
    playersRejected: {type: [mongoose.Schema.Types.ObjectId], ref: 'Player'},
    gameId: {type: String, required: true},
    lines: {
        startingGoalie: {type: mongoose.Schema.Types.ObjectId, ref: 'Player', autopopulate: true},
        backupGoalie: {type: mongoose.Schema.Types.ObjectId, ref: 'Player', autopopulate: true},
        skaters: [{
            linePosition: {type: String, required: true},
            playerId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Player', autopopulate: true}
        }]
    },
    result: {
        teamGoals: {type: Number, min: 0},
        opponentGoals: {type: Number, min: 0}
    }
})

gameSchema.virtual('title').get(function() {
    return this.atHome ? `${this.team.name} vs ${this.opponent}` : `${this.opponent} vs ${this.team.name}`;
});

gameSchema.virtual('shortTitle').get(function() {
    return `${this.atHome ? 'Vs' : '@'} ${this.opponent}`;
});

gameSchema.virtual('dateString').get(function() {
    return this.date.toJSON().slice(0,10).split('-').reverse().join('/');
});

gameSchema.virtual('dateTimeString').get(function() {
    return `${this.date.toJSON().slice(0,10).split('-').reverse().join('/')} at ${this.date.toLocaleTimeString()}`;
});

gameSchema.virtual('score').get(function() {
    if (this.result == null || this.result.teamGoals == null || this.result.opponentGoals == null) {
        return 'Awaiting result';
    }
    return `${this.result.teamGoals}-${this.result.opponentGoals} ${this.result.teamGoals > this.result.opponentGoals ? 'W' : this.result.teamGoals < this.result.opponentGoals ? 'L' : 'D'}`;
});

gameSchema.virtual('resultSubmitted').get(function() {
    return this.result != null && this.result.teamGoals != null && this.result.opponentGoals != null;
})

gameSchema.virtual('linesSubmitted').get(function() {
    return this.lines.skaters.length > 0;
})

gameSchema.set('toObject', { virtuals: true });

gameSchema.plugin(require('mongoose-autopopulate'));
gameSchema.plugin(require('mongoose-lean-virtuals'));

module.exports = mongoose.model('Game', gameSchema);