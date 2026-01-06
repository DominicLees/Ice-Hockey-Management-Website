const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const returnLoggedInUsersToDash = require('./middleware/returnLoggedInUsersToDash.js');
const returnUnauthenticatedUsersToIndex = require('./middleware/returnUnauthenticatedUsersToIndex.js');

// CONFIGURATION
const config = require('./config.json');
const port = config.port || 8000;
const enviroment = process.env.NODE_ENV || config.enviroment || 'dev';

// SETUP

// Setup Express
const app = express();
app.set('view engine', 'pug');
app.locals.basedir = path.join(__dirname, 'views');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static('./public'));

// Setup Express-Session
app.use(session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: enviroment == 'production' }
}))

// Connect to MongoDB
const dbName = enviroment === 'production' ? 'production' : config.database ?? 'development';
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => console.log(`Connected to database: ${result.connections[0].name}`))
.catch((error) => console.log(error));

// MIDDLEWARE

// Pass any responses and account information to res.locals
app.use('/', (req, res, next) => {
    if (req.method == 'GET') {
        // Responses only copied to locals on get requests, as the user will not see them if a page is not rendered
        res.locals.responses = req.session.responses || {};
        req.session.responses = {};
        // Copy the variables in the GET query to locals
        res.locals = Object.assign(res.locals, req.query);
    }
    res.locals.account = req.session.account;
    next();
})

// ROUTES

app.get('/', returnLoggedInUsersToDash, (req, res) => {
    res.render('index');
})

// Handles signing up, logging in and logging out
const authRouter = require('./routers/auth.js');
app.use('/', authRouter);

// Handles routes for the dashboard and schedule page
const dashRouter = require('./routers/dashboard');
app.use('/', returnUnauthenticatedUsersToIndex, dashRouter);

// Handles creating and joining teams
const teamRouter = require('./routers/team.js');
app.use('/team', returnUnauthenticatedUsersToIndex, teamRouter);

// Handles creating and signing up to games
const gameRouter = require('./routers/game.js');
app.use('/team/:code/game', gameRouter);

// Handles routes for player profiles
const playerRouter = require('./routers/player.js');
app.use('/player', returnUnauthenticatedUsersToIndex, playerRouter);

// ERROR HANDLING

// Handles 404s and provides test routes for the server to intentionally throw errors
const errorRouter = require('./routers/error.js');
app.use('/', errorRouter);

// Catch errors thrown by all route handlers
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        code: err.status,
        stack: enviroment == 'dev' ? err.stack : null
    })
})

app.listen(port, () => {
    console.log(`Server is listening on port ${port} in ${enviroment} mode`);
})