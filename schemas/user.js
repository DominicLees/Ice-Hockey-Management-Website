const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {type: String, required: true},
    name: {type: String, required: true},
    credentials: [{
        credentialId: Buffer,
        publicKey: {
            1: Number,
            3: Number,
            neg1: Number,
            neg2: Buffer,
            neg3: Buffer
        }
    }],
    authCode: {
        code: String,
        timeout: Date
    }
})

module.exports = mongoose.model('User', userSchema);