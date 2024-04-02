const express = require('express');
const errorRouter = express.Router();
const forbiddenError = require('./../functions/forbiddenError');

const config = require('./../config.json');
const enviroment = process.env.NODE_ENV || config.enviroment || 'dev';

// Testing routes only accessible during development
errorRouter.use('/test', (req, res, next) => {
    if (enviroment == 'dev') return next();
    res.redirect('/404');
});

// Routes that always throw errors to test error handling
errorRouter.get('/test/403', (req, res, next) => {
    next(forbiddenError());
})

errorRouter.get('/test/500', (req, res, next) => {
    const err = new Error('Internal Error');
    err.status = 500;
    next(err);
})

errorRouter.get('/test/style-testing', (req, res) => {
    res.render('partials/style-testing');
})

// 404 Route
errorRouter.get('/404', (req, res) => {
    res.render('error', {
        code: 404,
        path: req.session.oldPath
    })
})

// Catch all unhandled requests as 404 errors
errorRouter.use((req, res, next) => {
    req.session.oldPath = req.path;
    res.redirect('/404');
})

module.exports = errorRouter;