const express = require('express');
const User = require('./../schemas/user');
const validateEmail = require("email-validator").validate;
const authRouter = express.Router();

const config = require('./../config.json');
const enviroment = process.env.NODE_ENV || config.enviroment || "dev";
const autoVerify = enviroment == "dev" && config.autoVerify == "true";
if (autoVerify) { console.log('Auto verify new accounts is enabled') }
const unverifiedLogin = enviroment == "dev" && config.unverifiedLogin == "true";
if (unverifiedLogin) { console.log('Unverified login is enabled') }

// Check if the email given by the user already has an account
authRouter.use(['/login', '/signup'], (req, res, next) => {
    req.validEmail = validateEmail(req.body.email);
    if (!req.validEmail) {return next()}
    User.findOne({email: req.body.email}).then(result => {
        req.foundUser = result;
        next();
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

authRouter.post('/signup', (req, res) => {
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

    // Add new user to database
    const newUser = new User({
        email: req.body.email,
        name: req.body.name,
        verified: autoVerify
    })
    newUser.save().then(result => {
        req.session.responses.successfulSignUp = true;
        res.redirect('/');
    }).catch(error => {
        console.log(error);
        res.status(500).send();
    })
})

authRouter.post('/login', (req, res) => {
    if (!req.foundUser) {
        req.session.responses.accountNotFound = true;
        return res.redirect('/');
    }

    if (unverifiedLogin) {
        req.session.account = req.foundUser;
        req.session.authenticated = true;
        return res.redirect('/dashboard');
    }

    // Send login email
})

module.exports = authRouter;