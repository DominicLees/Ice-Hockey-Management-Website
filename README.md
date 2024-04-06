# How to host the website locally on your device

## Create a config.json file

In the root folder of the project create a file named 'config.json', with the following contents:
```json
{
    "cookieSecret": "This can be any string, leaving it as this will work",
    "mongoLogin": "Inspector:project@main.htwiein.mongodb.net",
    "enviroment": "dev",
    "database": "FinalYearProject"
}
```

This configuration gives you access to an empty database called 'FinalYearProject'.

## Install NodeJS modules

You will need [NodeJS](https://nodejs.org/en/download) installed. This comes with the node package manager (NPM). Run
```
npm i
```
in the root folder of the project

## Start the server

Run
```
npm start
```
in the root of the project. This will start by compiling the client-side JavaScript and CSS. If successful, you should see a message saying which port the server is running on and a message confirming you have connected to the database. The default port is [port 8000](http://localhost:8000/). You can change this by setting a "port" value in the config.json.

## Testing Scripts

I have provided several testing scripts to help with exploring my website. These can be found in /testing/scripts/

### Generate Testing DB

This script generates a specified number of users, teams and players.
```
node testing/scripts/generateTestingDB.js
```
The parameters are:
- users - default: 20 - the number of users to put in the database
- teams - default: 1 - the number of teams to put in the database
- players - default: 20 - the number of players to put on each team. Must be less than or equal to users
- clear - default: false - if true, database is cleared before generating a new one

### Make User Coach
Makes the provided user the coach of a team
```
node testing/scripts/makeUserCoach.js
```
The parameters are:
- email - the email of the user account you want to make the coach
- teamCode - the team code of the team you want to be coach of

### Signup All Players to a Game

Signs up all of the players on a team to the provided game.
```
node testing/scripts/signupAllPlayersToGame.js
```
The parameters are:
- id - the id of the game in the database. This can be in the link for game. /team/\<teamCode\>/game/\<id\>