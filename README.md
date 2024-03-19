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

You will need [NodeJS](https://nodejs.org/en/download) installed. This comes the node package manager (NPM). Run
```
npm i
```
in the root folder of the project

## Start the server

Run
```
npm start
```
in the root of the project. This will start by compiling the client-side JavaScript and CSS. If successful, you should see a message saying what port the server is running on and a message confirming you have connected to the database. The default port is [port 8000](http://localhost:8000/). You can change this by setting a "port" value in the config.json.