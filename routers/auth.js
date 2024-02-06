const express = require('express');
const authRouter = express.Router();
const crypto = require('crypto');
const cbor = require('cbor');
const validateEmail = require("email-validator").validate;
const returnLoggedInUsersToDash = require('./../middleware/returnLoggedInUsersToDash.js');
const User = require('./../schemas/user');

const config = require('./../config.json');
const enviroment = process.env.NODE_ENV || config.enviroment || "dev";
const unverifiedLogin = enviroment == "dev" && config.unverifiedLogin == "true";
if (unverifiedLogin) { console.log('Unverified login is enabled') }

authRouter.get('/challenge', (req, res) => {
    const challenge = crypto.randomBytes(32).toString();
    req.session.challenge = challenge;
    res.send(challenge);
})

// // Check if the email given by the user already has an account
// authRouter.use(['/login', '/signup'], returnLoggedInUsersToDash, (req, res, next) => {
//     req.validEmail = validateEmail(req.body.email);
//     if (!req.validEmail) {return next()}
//     User.findOne({email: req.body.email}).then(result => {
//         req.foundUser = result;
//         next();
//     }).catch(error => {
//         next(error);
//     })
// })

authRouter.post('/signup', (req, res, next) => {
    // Validate input
    // if (req.foundUser) {
    //     req.session.responses.emailInUse = true;
    // } if (!req.validEmail) {
    //     req.session.responses.invalidSignUpEmail = true;
    // } if (req.body.name.length == 0) {
    //     req.session.responses.invalidName = true;
    // }

    // Invalid details given, return user to homepage
    if (Object.keys(req.session.responses).length > 0) {
        return res.redirect('/');
    }

    // Convert the challenge sent back by the client from base64 to utf-8
    const decodedChallengeFromClient = Buffer.from(req.body.clientData.challenge, 'base64').toString('utf-8');

    // Validate credentials
    // Challenge from client must match one sent by the server
    if (req.session.challenge != decodedChallengeFromClient) {
        return res.status(400).send('Challenges did not match');
    } 
    // Client data must be from an attempt to register a new auth pass
    if (req.body.clientData.type != 'webauthn.create') {
        return res.status(400).send('Wrong type');
    } 
    // Registration must have been done on our site
    if (req.body.clientData.crossOrigin) {
        return res.status(400).send('Cross origin auth attempt');
    }
    
    // Convert the authData from CBOR to an Object
    const authData = cbor.decodeAllSync(new Uint8Array(Object.values(req.body.attestationObject)))[0].authData;
    // Get the length of the credential ID
    const dataView = new DataView(new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);
    idLenBytes.forEach((value, index) => dataView.setUint8(index, value));
    const credentialIdLength = dataView.getUint16();
    // Get the credential ID
    const credentialId = authData.slice(55, 55 + credentialIdLength).toString();
    // Get the bytes for the public key object
    const publicKeyBytes = authData.slice(55 + credentialIdLength);
    // The public key bytes are encoded as CBOR
    const publicKeyObject = cbor.decodeAllSync(publicKeyBytes)[0];

    // Add new user to database
    const newUser = new User({
        email: req.body.email,
        name: req.body.name,
        credentialId,
        publicKey: {
            1: publicKeyObject.get(1),
            3: publicKeyObject.get(3),
            neg1: publicKeyObject.get(-1),
            neg2: publicKeyObject.get(-2).toString(),
            neg3: publicKeyObject.get(-3).toString()
        }
    })
    newUser.save().then(result => {
        req.session.responses.successfulSignUp = true;
        res.status(200).send();
    }).catch(error => {
        next(error);
    })
})

authRouter.post('/login', (req, res) => {
    if (!req.validEmail) {
        req.session.responses.invalidLoginEmail = true;
        return res.redirect('/');
    }

    if (!req.foundUser) {
        return res.redirect('/');
    }

    if (unverifiedLogin) {
        req.session.account = req.foundUser;
        req.session.authenticated = true;
        return res.redirect('/dashboard');
    }

    // Send login email
    req.session.responses.authEmailSent = true;
})

authRouter.get('/logout', (req, res) => {
    req.session.authenticated = false;
    req.session.account = {};
    res.redirect('/');
})

module.exports = authRouter;