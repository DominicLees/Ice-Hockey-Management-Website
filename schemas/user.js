const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {type: String, required: true},
    name: {type: String, required: true},
    credentialId: Buffer,
    publicKey: {
        1: Number,
        3: Number,
        neg1: Number,
        neg2: Buffer,
        neg3: Buffer,
    }
})

module.exports = mongoose.model('User', userSchema);