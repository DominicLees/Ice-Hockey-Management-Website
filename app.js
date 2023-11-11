const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const port = 8000;
const config = require('./config.json');
const enviroment = process.env.NODE_ENV || config.enviroment || "dev";

// Setup Express
app.set('view engine', "pug");
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Setup Express-Session
app.use(session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: enviroment == "production" }
}))

// Connect to MongoDB
const dbName = process.env.NODE_ENV === 'production' ? 'production' : 'development';
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => console.log(`Connected to database: ${result.connections[0].name}`))
.catch((error) => console.log(error));

// MIDDLEWARE

// Pass any responses and account information to res.locals
app.use('/', (req, res, next) => {
    res.locals.responses = req.session.responses || {};
    req.session.responses = {};
    res.locals.account = req.session.account;
    next();
})

// ROUTES

app.get('/', (req, res) => {
    res.render('index');
})

const authRouter = require('./routers/auth.js');
app.use('/', authRouter);

// Users need to be logged in to access routes below this point
app.use('/', (req, res, next) => {
    if (!req.session.authenticated) {
        return res.redirect('/');
    }
    next();
})

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
})

const teamRouter = require('./routers/team.js');
app.use('/team', teamRouter);

app.listen(port, () => {
    console.log(`Server is listening on port ${port} in ${enviroment} mode`);
})