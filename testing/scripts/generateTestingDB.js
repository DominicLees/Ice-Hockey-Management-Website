const mongoose = require('mongoose');
const crypto = require('crypto');
const argv = require('yargs').argv;
const config = require('./../../config.json');
const User = require('./../../schemas/user');
const Team = require('./../../schemas/team');
const Player = require('./../../schemas/player');
const dbName = argv.db ?? config.database ?? 'development';

const userNames = require('./../data/users.json').names;
const teamData = require('./../data/teams.json');
const teamNames = teamData.teamNames;
const places = teamData.places;
const positions = ['LW', 'C', 'RW', 'LD', 'RD', 'G'];

async function generateDB() {
    if (argv.clear) {
        await User.collection.drop();
        await Team.collection.drop();
        await Player.collection.drop();
    }

    let users = [];
    for (let i = 0; i < (argv.users ?? 20); i++) {
        const firstName = userNames[Math.floor(Math.random() * userNames.length)];
        users.push({
            name: `${firstName} ${userNames[Math.floor(Math.random() * userNames.length)]}`,
            email: `${firstName}@hockey.com`
        })
    }

    users = await User.insertMany(users);
    console.log(`${users.length} users inserted into DB`);

    let teams = [];
    for (let i = 0; i < (argv.teams ?? 1); i++) {
        teams.push({
            name: `${places[Math.floor(Math.random() * places.length)]} ${teamNames[Math.floor(Math.random() * teamNames.length)]}`,
            coach: users[Math.floor(Math.random() * users.length)]._id,
            code: crypto.randomBytes(3).toString('hex')
        })
    }
    teams = await Team.insertMany(teams);
    console.log(`${teams.length} teams inserted into DB`);

    let players = [];
    teams.forEach(team => {
        let usersCopy = users;
        for (let i = 0; i < (argv.players ?? 20); i++) {
            players.push({
                user: usersCopy.splice(Math.floor(Math.random() * usersCopy.length), 1)[0]._id,
                team: team._id,
                positions: positions.sort(() => Math.random() - Math.random()).slice(0, Math.max(Math.floor(Math.random() * positions.length), 1)),
                privacy: 'public'
            })
        }
    });
    players = await Player.insertMany(players);
    console.log(`${players.length} players inserted into DB`);
}

// Connect to MongoDB
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => {
    console.log(`Connected to database: ${result.connections[0].name}`);
    return generateDB();
}).then(() => {
    process.exit();
}).catch((error) => console.log(error));