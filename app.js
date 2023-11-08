const express = require('express');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const PORT = 8000;
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

app.get('/', (req, res) => {
    res.render('index');
})

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT} in ${enviroment} mode`);
})