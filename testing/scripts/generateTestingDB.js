const mongoose = require('mongoose');
const crypto = require('crypto');
const argv = require('yargs').argv;
const config = require('./../../config.json');
const User = require('./../../schemas/user');
const Team = require('./../../schemas/team');

const userNames = require('./../data/users.json').names;
const teamData = require('./../data/teams.json');
const teamNames = teamData.teamNames;
const places = teamData.places;

function generateDB() {
    let users = [];
    for (let i = 0; i < argv.users; i++) {
        const firstName = userNames[Math.floor(Math.random() * userNames.length)];
        users.push({
            name: `${firstName} ${userNames[Math.floor(Math.random() * userNames.length)]}`,
            email: `${firstName}@hockey.com`
        })
    }

    User.insertMany(users).then(result => {
        console.log(`${result.length} users inserted into DB`);
        let teams = []
        for (let i = 0; i < argv.teams; i++) {
            teams.push({
                name: `${places[Math.floor(Math.random() * places.length)]} ${teamNames[Math.floor(Math.random() * teamNames.length)]}`,
                coach: result[Math.floor(Math.random() * result.length)]._id,
                code: crypto.randomBytes(3).toString('hex')
            })
        }
        return Team.insertMany(teams);
    }).then(result => {
        console.log(`${result.length} teams inserted into DB`);
        process.exit();
    }).catch(error => {
        console.log(error);
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