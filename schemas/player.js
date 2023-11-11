const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    team: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Team'},
    positions: {type: [String], required: true}
})

module.exports = mongoose.model('Player', playerSchema);