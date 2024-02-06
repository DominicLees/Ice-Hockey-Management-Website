const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {type: String, required: true},
    name: {type: String, required: true},
    credentialId: String,
    publicKey: {
        1: Number,
        3: Number,
        neg1: Number,
        neg2: String,
        neg3: String,
    }
})

module.exports = mongoose.model('User', userSchema);