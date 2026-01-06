const mongoose = require('mongoose');
const crypto = require('crypto');
const argv = require('yargs').argv;
const config = require('./../../config.json');
const User = require('./../../schemas/user');
const Team = require('./../../schemas/team');
const Player = require('./../../schemas/player');
const dbName = argv.db ?? config.database ?? 'development';

const data = require(`./../testingDBs/${argv.data}.json`);

async function loadDB() {
    if (argv.clear) {
        await User.collection.drop();
        await Team.collection.drop();
        await Player.collection.drop();
    }

    let users = [];
    data.users.forEach(name => {
        users.push({
            email: `${name}@hockey.com`,
            name
        })
    })

    users = await User.insertMany(users);
    console.log(`${users.length} users inserted into DB`);

    let teams = [];
    data.teams.forEach(team => {
        teams.push({
            name: team.name,
            coach: users.find(user => user.name == team.coach)._id,
            code: crypto.randomBytes(3).toString('hex')
        })
    })

    teams = await Team.insertMany(teams);
    console.log(`${teams.length} teams inserted into DB`);

    let players = [];
    data.players.forEach(player => {
        players.push({
            user: users.find(user => player.user == user.name),
            team: teams.find(team => player.name == team.team),
            positions: player.positions
        })
    })

    players = await Player.insertMany(players);
    console.log(`${players.length} players inserted into DB`);

}

// Connect to MongoDB
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => {
    console.log(`Connected to database: ${result.connections[0].name}`);
    return loadDB();
}).then(() => {
    process.exit();
}).catch((error) => console.log(error));