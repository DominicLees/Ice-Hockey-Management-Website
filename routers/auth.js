const express = require('express');
const User = require('./../schemas/user');
const validateEmail = require("email-validator").validate;
const authRouter = express.Router();

const config = require('./../config.json');
const enviroment = process.env.NODE_ENV || config.enviroment || "dev";
const autoVerify = enviroment == "dev" && config.autoVerify == "true";
if (autoVerify) { console.log('Auto verify new accounts is enabled') }

authRouter.post('/signup', (req, res) => {
    // Validate input
    if (!validateEmail(req.body.email)) {
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

module.exports = authRouter;