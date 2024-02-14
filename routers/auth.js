const express = require('express');
const authRouter = express.Router();
const crypto = require('crypto');
const cbor = require('cbor');
const cosekey = require('parse-cosekey');
const validateEmail = require("email-validator").validate;
const returnLoggedInUsersToDash = require('./../middleware/returnLoggedInUsersToDash.js');
const User = require('./../schemas/user');

function verifyClientData(req, res, next) {
    if (req.body.clientData == null) {
        return res.status(400).send('No client data sent');
    }

    // Convert the challenge sent back by the client from base64 to utf-8
    const decodedChallengeFromClient = Buffer.from(req.body.clientData.challenge, 'base64').toString('utf-8');

    // Challenge from client must match the one sent by the server
    if (req.session.challenge == null || req.session.challenge != decodedChallengeFromClient) {
        req.session.challenge = null;
        return res.status(400).send('Challenges did not match');
    } 
    // Client data must be from the correct authenticator method
    const expectedType = req.path == '/signup' ? 'create' : 'get'
    if (req.body.clientData.type != `webauthn.${expectedType}`) {
        return res.status(400).send('Wrong type');
    } 
    // Authentication must have been done on our site
    if (req.body.clientData.crossOrigin) {
        return res.status(400).send('Cross origin auth attempt');
    }
    next();
}

authRouter.get('/challenge', (req, res) => {
    const challenge = crypto.randomBytes(32).toString();
    req.session.challenge = challenge;
    res.send(challenge);
})

// Check if the email given by the user already has an account
authRouter.use(['/login', '/signup'], returnLoggedInUsersToDash, (req, res, next) => {
    req.validEmail = validateEmail(req.body.email);
    if (!req.validEmail) {return next()}
    User.findOne({email: req.body.email}).then(result => {
        req.foundUser = result;
        next();
    }).catch(error => {
        next(error);
    })
})

authRouter.post('/signup', verifyClientData, (req, res, next) => {
    // Validate input
    if (req.foundUser) {
        req.session.responses.emailInUse = true;
    } if (!req.validEmail) {
        req.session.responses.invalidSignUpEmail = true;
    } if (req.body.name.length == 0) {
        req.session.responses.invalidName = true;
    }

    // Invalid details given, return user to homepage
    if (Object.keys(req.session.responses).length > 0) {
        return res.redirect('/');
    }
    
    // Convert the authData from CBOR to an Object
    const authData = cbor.decodeAllSync(new Uint8Array(Object.values(req.body.attestationObject)))[0].authData;
    // Get the length of the credential ID
    const dataView = new DataView(new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);
    idLenBytes.forEach((value, index) => dataView.setUint8(index, value));
    const credentialIdLength = dataView.getUint16();
    // Get the credential ID
    const credentialId = authData.slice(55, 55 + credentialIdLength);
    // Get the bytes for the public key object
    const publicKeyBytes = authData.slice(55 + credentialIdLength);
    // The public key bytes are encoded as CBOR
    const publicKeyObject = cbor.decodeAllSync(publicKeyBytes)[0];

    // Add new user to database
    const newUser = new User({
        email: req.body.email,
        name: req.body.name,
        credentials:[{
            credentialId,
            publicKey: {
                1: publicKeyObject.get(1),
                3: publicKeyObject.get(3),
                neg1: publicKeyObject.get(-1),
                neg2: publicKeyObject.get(-2),
                neg3: publicKeyObject.get(-3)
            }
        }]
    })
    newUser.save().then(result => {
        req.session.responses.successfulSignUp = true;
        res.status(200).send();
    }).catch(error => {
        next(error);
    })
})

authRouter.get('/credentialId/:email', (req, res, next) => {
    User.findOne({email: req.params.email}).then(result => {
        if (result) {
            let credentials = [];
            result.credentials.forEach(credential => credentials.push(credential.credentialId));
            res.send(credentials);
        } else {
            res.sendStatus(404);
        }
    }).catch(error => {
        next(error);
    })
})

authRouter.post('/login', verifyClientData, (req, res) => {
    if (!req.validEmail) {
        req.session.responses.invalidLoginEmail = true;
        return res.redirect('/');
    }

    if (!req.foundUser) {
        return res.redirect('/');
    }

    // The signed data is made up of a sha256 hash of the client data and the raw bytes of the authenticator data
    const clientDataBuffer = crypto.createHash('sha256').update(Buffer.from(Object.values(req.body.clientDataJSON))).digest();
    const authenticatorDataBuffer = Buffer.from(new Uint8Array(Object.values(req.body.authenticatorData)), 'base64');
    const dataBuffer = Buffer.concat([authenticatorDataBuffer, clientDataBuffer]);
    const signature = Buffer.from(Object.values(req.body.signature));
    const credential = req.foundUser.credentials.find(credential => Buffer.compare(Buffer.from(credential.credentialId), Buffer.from(req.body.credentialId, 'base64')) == 0);

    // Get User's public key
    const coseMap = new Map()
    .set(1, credential.publicKey['1'])
    .set(3, credential.publicKey['3'])
    .set(-1, credential.publicKey['neg1'])
    .set(-2, Buffer.from(credential.publicKey['neg2']))
    .set(-3, Buffer.from(credential.publicKey['neg3']))
    // Key is converted from cose to jwk and crypto libary does not support cose
    const parsedKey = cosekey.KeyParser.cose2jwk(coseMap);
    const publicKey = crypto.createPublicKey({key: parsedKey, format: 'jwk'});

    crypto.verify(null, dataBuffer, publicKey, signature, (error, result) => {
        if (result == false) {
            return res.status(403).send('Failed to verify signature');
        } if (error) {
            return res.status(500).send();
        }
        
        // Authenticate User
        req.session.account = req.foundUser;
        req.session.authenticated = true;
        res.sendStatus(200);
    });
})

authRouter.get('/logout', (req, res) => {
    req.session.authenticated = false;
    req.session.account = {};
    res.redirect('/');
})

module.exports = authRouter;