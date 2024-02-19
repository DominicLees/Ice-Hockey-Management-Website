const mongoose = require('mongoose');
const argv = require('yargs').argv;
const config = require('./../../config.json');
const User = require('./../../schemas/user');
const Team = require('./../../schemas/team')
const Player = require('./../../schemas/player');
const Game = require('./../../schemas/game');
const dbName = argv.db ?? config.database ?? 'development';


async function signupPlayers() {
    const game = await Game.findOne({_id: argv.id});
    console.log(`Found game: ${game.title}`);
    const players = await Player.find({team: game.team});
    game.playersSignedUp = players.map(player => player._id);
    await game.save();
}

// Connect to MongoDB
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => {
    console.log(`Connected to database: ${result.connections[0].name}`);
    return signupPlayers();
}).then(() => {
    process.exit();
}).catch((error) => console.log(error));