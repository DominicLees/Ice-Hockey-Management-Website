const mongoose = require('mongoose');
const argv = require('yargs').argv;
const config = require('./../../config.json');
const names = require('./../data/users.json').names;
const User = require('./../../schemas/user');

function generateDB() {
    let users = [];
    for (let i = 0; i < argv.users; i++) {
        const firstName = names[Math.floor(Math.random() * names.length)];
        users.push({
            name: `${firstName} ${names[Math.floor(Math.random() * names.length)]}`,
            email: `${firstName}@hockey.com`
        })
    }
    User.insertMany(users).then(result => {
        console.log(`${result.length} users inserted into DB`);
        process.exit();
    })
}

// Connect to MongoDB
const dbName = config.database ?? 'development';
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => {
    console.log(`Connected to database: ${result.connections[0].name}`);
    generateDB();
})
.catch((error) => console.log(error));