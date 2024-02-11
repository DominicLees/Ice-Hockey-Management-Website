const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    team: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Team', autopopulate: true},
    opponent: {type: String, required: true},
    atHome: {type: Boolean, required: true},
    date: {type: Date, required: true},
    playersSignedUp: {type: [mongoose.Schema.Types.ObjectId], ref: 'Player'},
    gameId: {type: String, required: true},
    lines: {
        startingGoalie: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Player', autopopulate: true},
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

gameSchema.virtual('score').get(function() {
    return this.atHome ? this.result.teamGoals + '-' + this.result.opponentGoals : this.result.opponentGoals + '-' + this.result.teamGoals;
});

gameSchema.set('toObject', { virtuals: true });

gameSchema.plugin(require('mongoose-autopopulate'));
gameSchema.plugin(require('mongoose-lean-virtuals'));

module.exports = mongoose.model('Game', gameSchema);