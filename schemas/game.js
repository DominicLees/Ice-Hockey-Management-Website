const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    team: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Team'},
    opponent: {type: String, required: true},
    date: {type: Date, required: true},
    playersSignedUp: {type: [mongoose.Schema.Types.ObjectId], required: true, ref: 'Player'},
})

module.exports = mongoose.model('Game', gameSchema);