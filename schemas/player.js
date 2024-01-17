const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', autopopulate: true},
    team: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Team'},
    positions: {type: [String], required: true}
})

playerSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Player', playerSchema);