const mongoose = require('mongoose');
const argv = require('yargs').argv;
const config = require('./../../config.json');
const User = require('./../../schemas/user');
const Team = require('./../../schemas/team');
const Player = require('./../../schemas/player');
const dbName = argv.db ?? config.database ?? 'development';

let foundTeam;
mongoose.connect(`mongodb+srv://${config.mongoLogin}/?retryWrites=true&w=majority`, {dbName})
.then((result) => {
    console.log(`Connected to database: ${result.connections[0].name}`);
    return Team.findOne({code: argv.teamCode});
}).then(result => {
    foundTeam = result;
    console.log(`Found team: ${foundTeam.name}`);
    return User.findOne({email: argv.email});
}).then(foundUser => {
    console.log(`User found: ${foundUser.name}`);
    foundTeam.coach = foundUser._id;
    return foundTeam.save();
}).then(() => {
    console.log('Coach changed successfully');
    process.exit();
}).catch((error) => console.log(error));