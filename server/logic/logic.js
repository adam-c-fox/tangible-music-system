const express = require('express');
var cors = require("cors");
const http = require('http');
const webSocketServer = require('websocket').server;
const axios = require('axios');

// Express
const app = express();
const port = 8003;
app.get('/', (req, res) => res.send(as))
app.use(express.json());
app.use(cors());

// WS - Frontend
const frontendWsPort = 8001;
const frontendServer = http.createServer();
frontendServer.listen(frontendWsPort);
const frontendWsServer = new webSocketServer({
  httpServer: frontendServer 
});
frontend = null;

// Business logic
let repopulateLock = false;
let lastCommand = {};
const Command = {
  topTracks: 'topTracks',
  similarToNowPlaying: 'similarToNowPlaying',
  somethingDifferent: 'somethingDifferent',
  artistTopTracks: 'artistTopTracks'
}

function frontendLog(text) {
  console.log('[frontend] ' + text);
}

frontendWsServer.on('request', function(request) {
  const connection = request.accept(null, request.origin);
  frontend = connection;
  frontendLog(`${new Date()} Recieved a new connection from origin ${request.origin}.`);
  
  frontendWsServer.on('close', function(connection) {
    frontendLog(`${new Date()} Frontend disconnected.`);
    frontend = null;
  });
});

// ENDPOINTS ------------------------------ 

app.post('/frontend/send', function(req, res) {
    const { payload } = req.body;

    if (frontend != null) {
        frontend.sendUTF(JSON.stringify(payload));
    } 

    res.status(200).send();
});

app.get('/stacks/repopulate', function(req, res) {
    if(repopulateLock) { return; }

    console.log("REPOPULATE: ", lastCommand);

    switch(lastCommand.command) {
      case Command.topTracks:
        spotifyTopTracks(res);
        break;
      case Command.similarToNowPlaying:
        spotifySimilarToNowPlaying(lastCommand.payload, res);
        break;
      case Command.somethingDifferent:
        spotifySomethingDifferent(res);
        break;
      case Command.artistTopTracks:
        spotifyArtistTopTracks(lastCommand.payload, res);
        break;
    }

    repopulateLock = true;
    setTimeout(() => { repopulateLock = false; }, 1000);
});

// SPOTIFY FUNCTIONS ------------------------------ 

const host = process.env.HOST;
console.log(`host: ${host}`);
const spotifyPort = 8004;
const utilsPort = 8005;
const clientControllerPort = 8002;

function spotifyTopTracks(res) {
  axios.get(`http://${host}:${spotifyPort}/spotify/top-tracks`)
    .then(function (response) {
      sendTracksToStacks(response.data);
      res.status(200).send();
    });
}

function spotifyArtistTopTracks(artistName, res) {
  axios.get(`http://${host}:${spotifyPort}/spotify/artist-top-tracks?artistName=${artistName}`)
    .then(function (response) {
      sendTracksToStacks(response.data.body.tracks);
      res.status(200).send();
    });
}

function spotifySimilarToNowPlaying(nowPlayingTrackID, res) {
  axios.get(`http://${host}:${spotifyPort}/spotify/get-similar-tracks?trackID=${nowPlayingTrackID}`)
    .then(function (response) {
      sendTracksToStacks(response.data);
      res.status(200).send();
    });
}

function spotifySomethingDifferent(res) {
  axios.get(`http://${host}:${spotifyPort}/spotify/get-similar-tracks`)
    .then(function (response) {
      sendTracksToStacks(response.data);
      res.status(200).send();
    });
}

// SPOTIFY ENDPOINTS ------------------------------ 

app.get('/spotify/send/top-tracks', function(req, res) {
  lastCommand.command = Command.topTracks;

  updateClientList();
  spotifyTopTracks(res);
});

app.get('/spotify/send/artist-top-tracks', function(req, res) {
  lastCommand.command = Command.artistTopTracks;

  updateClientList();
  const { artistName } = req.query;
  lastCommand.payload = artistName;
  spotifyArtistTopTracks(artistName, res);
});

app.get('/spotify/send/similar-to-now-playing', function(req, res) {
  lastCommand.command = Command.similarToNowPlaying;

  updateClientList();
  const nowPlayingTrackID = clientState.get(nfcCurrentlyPlaying).id;
  lastCommand.payload = nowPlayingTrackID;
  spotifySimilarToNowPlaying(nowPlayingTrackID, res);
});

app.get('/spotify/send/something-different', function(req, res) {
  lastCommand.command = Command.somethingDifferent;
  
  updateClientList();
  spotifySomethingDifferent(res);
});

// STACKS ------------------------------ 
let clientList = [];
let nfcCurrentlyPlaying = '';
const clientState = new Map();
const stackNowPlayingTimeout = null;

function sendTracksToStacks(list) {
  clientList.forEach((element) => {
    const mac = element[0];

    if(mac === nfcCurrentlyPlaying) { return; }

    const index = Math.floor(Math.random() * (list.length - 1));
    const spotifyPayload = list[index];
    list.splice(index, 1);
  
    console.log(`${element[0]}: ${spotifyPayload.name}`);

    // Send text
    clearStackText(mac);
    sendTextToStack(mac, 10, 250, spotifyPayload.name);
    sendTextToStack(mac, 10, 265, spotifyPayload.album.name);
    sendTextToStack(mac, 10, 280, spotifyPayload.artists[0].name);

    // Convert and send image
    axios.post(`http://${host}:${utilsPort}/convert/jpeg-to-png?jpegUrl=${spotifyPayload.album.images[0].url}`)
      .then(function (response) {
        sendImageToStack(mac, 0, 0, response.data);
      })

    clientState.set(mac, spotifyPayload);
    sendUpdatedStateToFrontend(mac, spotifyPayload);
  });
}

app.post('/nfc/currently-playing', function(req, res) {
  const { nfc } = req.body.payload; 
  nfcCurrentlyPlaying = nfc;

  if (frontend != null) {
      frontend.sendUTF(JSON.stringify(req.body.payload));
  } 

  res.status(200).send();
});

function sendUpdatedStateToFrontend(mac, spotifyPayload) {
  const json = { mac, spotifyPayload };

  if (frontend != null ) {
    frontend.sendUTF(JSON.stringify(json));
  }
}

function updateClientList() {
  axios.get(`http://${host}:${clientControllerPort}/client/list`)
    .then(function (response) {
      clientList = response.data;
    })
}

function clearStackText(id) {
  axios.post(`http://${host}:${clientControllerPort}/send/clear?mac=${id}`);
}

function sendTextToStack(id, x, y, text) {
  const bodyString = `mac=${id}&text=${text}&x=${x}&y=${y}`;
  axios.post(`http://${host}:${clientControllerPort}/send/text?${bodyString}`);
}

function sendImageToStack(id, x, y, pngUrl) {
  const bodyString = `mac=${id}&pngUrl=${pngUrl}&x=${x}&y=${y}`;
  axios.post(`http://${host}:${clientControllerPort}/send/image?${bodyString}`);
}


app.listen(port, () => { console.log(`logic REST interface: ${port}`); });
