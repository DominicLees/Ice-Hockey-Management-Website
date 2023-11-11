const express = require('express');
const teamRouter = express.Router();

teamRouter.get('/new', (req, res) => {
    res.render('pages/team/new');
})

module.exports = teamRouter;