const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {type: String, required: true},
    coach: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    location: {type: String, required: true},
    code: {type: String, required: true}
})

module.exports = mongoose.model('Team', teamSchema);