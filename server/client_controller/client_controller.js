// Websockets
const webSocketServer = require('websocket').server;
const http = require('http');

// WS - Clients 
const clientsWsPort = 8000;
const clientsServer = http.createServer();
clientsServer.listen(clientsWsPort);
const clientsWsServer = new webSocketServer({
  httpServer: clientsServer
});

// WS - Frontend
const frontendWsPort = 8001;
const frontendServer = http.createServer();
frontendServer.listen(frontendWsPort);
const frontendWsServer = new webSocketServer({
  httpServer: frontendServer 
});

// Express
const express = require('express');
var cors = require("cors");
const app = express();
const port = 8002;
app.get('/', (req, res) => res.send(as))
app.use(express.json());
app.use(cors());

// Spotify
const spotify = require('spotify-web-api-node');
const spotifyApi = new spotify({
  clientId: '52e914108f7c4726aa4e02fb8923ae41',
  clientSecret: '65de00e35a4341e3965c9224340a0f68',
  redirectUri: 'http://192.168.0.14:8002/spotify/callback'
})
const scopes = ['app-remote-control', 'streaming'];
const state = "";
const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
let spotifyAuthCode = "";

// Business logic
const clients = {};
var frontend = null;

function clientsLog(text) {
  console.log('[clients] ' + text);
}

function frontendLog(text) {
  console.log('[frontend] ' + text);
}

const getUniqueID = () => {
  //const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  //return s4() + s4() + '-' + s4();

  return Object.keys(clients).length;
};



// WEBSOCKETS ----------------------------------------  

clientsWsServer.on('request', function(request) {
  var userID = getUniqueID();
  clientsLog(`${new Date()} Received a new connection from origin ${request.origin}.`);
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  clientsLog(`connected: ${userID} in ${Object.getOwnPropertyNames(clients)}`);

  // Pass userID to device 
  const json = { command:"id", userID:Number(userID) };
  connection.sendUTF(JSON.stringify(json));
  
  // Display ID on LCD
  connection.sendUTF(`{ \"command\": \"text\", \"text\":\"${userID}\", \"x\": 10, \"y\": 10 }`)

  connection.on('message', function(message) {
    clientsLog(`[${userID}] message: ${message.utf8Data}`);
    const msgContents = JSON.parse(message.utf8Data);

    if(frontend != null) {
      const json = { id: Number(userID), focus: msgContents['focus']}
      frontend.sendUTF(JSON.stringify(json));
    }
  });

  connection.on('close', function(reasonCode, description) {
    clientsLog(`[${userID}] close: ${description} (${reasonCode})`);
    //delete clients[userID];
  });

  clientsWsServer.on('close', function(connection) {
    clientsLog(`${new Date()} Peer ${userID} disconnected.`);
    //delete clients[userID];
  });
});

frontendWsServer.on('request', function(request) {
  const connection = request.accept(null, request.origin);
  frontend = connection;
  frontendLog(`${new Date()} Recieved a new connection from origin ${request.origin}.`);
  
  frontendWsServer.on('close', function(connection) {
    frontendLog(`${new Date()} Frontend disconnected.`);
    frontend = null;
  });
});


// CONTROL ENDPOINTS ----------------------------------------  

app.post('/send/image', function(req, res) {
  var ID = req.query.ID;
  var pngUrl = req.query.pngUrl;
  var x = Number(req.query.x);
  var y = Number(req.query.y);

  const json = { command:"pngUrl", url:pngUrl, x:x, y:y };
  console.log(`[image] [${ID}] ${JSON.stringify(json)}`);

  clients[ID].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.post('/send/text', function(req, res) {
  var ID = req.query.ID;
  var text = req.query.text;
  var x = Number(req.query.x);
  var y = Number(req.query.y);

  const json = { command:"text", text:text, x:x, y:y };
  console.log(`[text] [${ID}] ${JSON.stringify(json)}`);

  clients[ID].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.get('/client/list', function(req, res) {
  res.json(Object.keys(clients));
});


// SPOTIFY ENDPOINTS ----------------------------------------  

function spotifyPause() {
  spotifyApi.pause()
    .then(function(data) { console.log("[spotify] pause"); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
};

function spotifyPlay() {
  spotifyApi.play()
    .then(function(data) { console.log("[spotify] play"); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
};

app.post('/spotify/control', function(req, res) {
  const command = req.query.command;

  if(command == 'pause') {
    spotifyPause();
  } else if (command == 'play') {
    spotifyPlay();
  } else {
    res.status(404).send(`Command '${command}' not found`);
  }

  res.status(200).send();
});

app.get('/spotify/callback', function(req, res) {
  // Auth code result  
  spotifyAuthCode = req.query.code;
  res.status(200).send("Auth code set.");

  spotifyApi.authorizationCodeGrant(spotifyAuthCode)
    .then(function(data) {
      console.log("access_token", data.body['access_token']);
      console.log("refresh_token", data.body['refresh_token']);

      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
    })
    .catch(function(err) {
      console.log("[spotify] Something went wrong...", err)
    });
});

app.get('/spotify/authorise', function(req, res) {
  res.status(200).redirect(authorizeURL);
});

app.listen(port, () => console.log(`m5stack REST interface: ${port}`))
