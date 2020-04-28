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

app.listen(port, () => { console.log(`logic REST interface: ${port}`); });

// SPOTIFY ------------------------------ 

const host = process.env.HOST;
console.log(`host: ${host}`);
const spotifyPort = 8004;
const utilsPort = 8005;
const clientControllerPort = 8002;

app.get('/spotify/send/top-tracks', function(req, res) {
  updateClientList();

  axios.get(`http://${host}:${spotifyPort}/spotify/top-tracks`)
    .then(function (response) {
      sendTracksToStacks(response.data);
      res.status(200).send();
    })
});

app.get('/spotify/send/artist-top-tracks', function(req, res) {
  updateClientList();
  const { artistName } = req.query;

  axios.get(`http://${host}:${spotifyPort}/spotify/artist-top-tracks?artistName=${artistName}`)
    .then(function (response) {
      sendTracksToStacks(response.data.body.tracks);
      res.status(200).send();
    })
});

app.get('/spotify/send/similar-to-now-playing', function(req, res) {
  updateClientList();
  const nowPlayingTrackID = clientState.get(nfcCurrentlyPlaying).id;

  axios.get(`http://${host}:${spotifyPort}/spotify/get-similar-tracks?trackID=${nowPlayingTrackID}`)
    .then(function (response) {
      console.log(response.data);
      sendTracksToStacks(response.data);
      res.status(200).send();
    })
});

app.get('/spotify/send/something-different', function(req, res) {
  updateClientList();

  axios.get(`http://${host}:${spotifyPort}/spotify/get-similar-tracks`)
    .then(function (response) {
      sendTracksToStacks(response.data);
      res.status(200).send();
    })
});

// STACKS ------------------------------ 
let clientList = [];
let nfcCurrentlyPlaying = '';
const clientState = new Map();

function sendTracksToStacks(list) {
  clientList.forEach((element) => {
    const mac = element[0];

    // TODO: implement currently playing stack
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
