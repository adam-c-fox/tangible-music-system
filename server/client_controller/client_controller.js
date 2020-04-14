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
  //redirectUri: 'http://192.168.0.14:8002/spotify/callback'
  redirectUri: 'http://localhost:8002/spotify/callback'
})
const scopes = ['app-remote-control', 'streaming', 'user-top-read', 'user-read-playback-state'];
const state = "";
const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
let spotifyAuthCode = "";

// Utils
const sharp = require("sharp");
const fs = require('fs');
const request = require('request');

// Business logic
const connections = {};
const macToConnections = new Map();
var frontend = null;
let nfcToMac = new Map();
nfcToMac.set(89, 'A4:CF:12:76:9A:A8');
nfcToMac.set(95, '80:7D:3A:DB:D9:24');
nfcToMac.set(108, '24:6F:28:AE:99:9C');

function clientsLog(text) {
  console.log('[clients] ' + text);
}

function frontendLog(text) {
  console.log('[frontend] ' + text);
}

const getUniqueID = () => {
  //const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  //return s4() + s4() + '-' + s4();

  return Object.keys(connections).length;
};



// WEBSOCKETS ----------------------------------------  

clientsWsServer.on('request', function(request) {
  const userID = getUniqueID();
  clientsLog(`${new Date()} Received a new connection from origin ${request.origin}.`);
  const connection = request.accept(null, request.origin);
  connections[userID] = connection;
  clientsLog(`connected: ${userID} in ${Object.getOwnPropertyNames(connections)}`);

  // Pass userID to device 
  const json = { command:"id", userID:Number(userID) };
  connection.sendUTF(JSON.stringify(json));
  
  // Display ID on LCD
  connection.sendUTF(`{ \"command\": \"text\", \"text\":\"${userID}\", \"x\": 220, \"y\": 300 }`)

  connection.on('message', function(message) {
    clientsLog(`[${userID}] message: ${message.utf8Data}`);
    const msgContents = JSON.parse(message.utf8Data);
    const numOfFields = Object.getOwnPropertyNames(msgContents).length;

    if ('mac' in msgContents && numOfFields === 1) {
      macToConnections.set(msgContents.mac, userID);
    } else if(frontend != null) {
      const json = { id: Number(userID), mac: msgContents['mac'], focus: msgContents['focus'] }
      frontend.sendUTF(JSON.stringify(json));
    }
  });

  connection.on('close', function(reasonCode, description) {
    clientsLog(`[${userID}] close: ${description} (${reasonCode})`);
  });

  clientsWsServer.on('close', function(connection) {
    clientsLog(`${new Date()} Peer ${userID} disconnected.`);
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


// STACK CONTROL ENDPOINTS ----------------------------------------  

app.post('/send/image', function(req, res) {
  const { mac, pngUrl, x, y } = req.query;

  const json = { command:"pngUrl", url:pngUrl, x:Number(x), y:Number(y) };
  console.log(`[image] [${mac}] ${JSON.stringify(json)}`);

  connections[macToConnections.get(mac)].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.post('/send/text', function(req, res) {
  const { mac, text, x, y } = req.query;

  const json = { command:"text", text:text, x:Number(x), y:Number(y) };
  console.log(`[text] [${mac}] ${JSON.stringify(json)}`);

  connections[macToConnections.get(mac)].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.post('/send/clear', function(req, res) {
  const { mac } = req.query;

  const json = { command:"clear" };
  console.log(`[clear] [${mac}]`);

  connections[macToConnections.get(mac)].sendUTF(JSON.stringify(json));

  res.status(200).send();
});

app.get('/client/list', function(req, res) {
  res.json(Array.from(macToConnections));
});


// NFC ENDPOINTS ----------------------------------------  

app.post('/nfc/send-tag', function(req, res) {
  const { tag } = req.query;

  console.log(`[tag] ${tag}`);

  if(frontend != null) {
    const json = { nfc: nfcToMac.get(Number(tag)) };
    frontend.sendUTF(JSON.stringify(json));
  }

  res.status(200).send();
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

app.get('/spotify/top-tracks', function(req, res) {
  spotifyApi.getMyTopTracks()
    .then(function(data) { 
      console.log("[spotify] top tracks") 
      res.status(200).json(data.body.items);
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.get('/spotify/artist-top-tracks', function(req, res) {
  const { artistName } = req.query;

  spotifyApi.searchArtists(artistName)
    .then(function(data) {
      const { id } = data.body.artists.items[0];

      spotifyApi.getArtistTopTracks(id, 'gb')
        .then(function(data) {
          res.status(200).json(data);
        })
        .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.post('/spotify/control', function(req, res) {
  const { command } = req.query;

  if(command == 'pause') {
    spotifyPause();
  } else if (command == 'play') {
    spotifyPlay();
  } else {
    res.status(404).send(`Command '${command}' not found`);
  }

  res.status(200).send();
});

app.post('/spotify/play/track', function(req, res) {
  const { trackUri } = req.query;

  const list = [ trackUri ]; 
  const json = { uris: list };

  spotifyApi.play(json)
    .then(function(data) { console.log("[spotify] play track: " + trackUri); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });

  res.status(200).send();
});

app.get('/spotify/callback', function(req, res) {
  // Auth code result  
  spotifyAuthCode = req.query.code;
  res.status(200).redirect("http://localhost:3000");

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

app.get('/spotify/has-credentials', function(req, res) {
  const creds = spotifyApi.getCredentials();

  res.status(200).json('accessToken' in creds);
});

app.get('/spotify/is-playing', function(req, res) {
  spotifyApi.getMyCurrentPlaybackState()
    .then(function(data) { res.status(200).json(data.body.is_playing ? true : false) })
    .catch(function(err) { res.status(500).json(err) });
});


// UTILS ----------------------------------------  

function convert(srcFilepath, destFilepath, res, url) {
  sharp(srcFilepath)
    .resize(100, 100)
    .png()
    .toFile(destFilepath, (err, info) => {
      //console.log(err);
      //console.log(info);
      returnResponse(res, url);
    })
}

async function wait(srcFilepath, destFilepath, res, url) {
  await sleep(300);
  convert(srcFilepath, destFilepath, res, url); 
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   

function returnResponse(res, returnUrl) {
  res.status(200).json(returnUrl);
};

app.post('/convert/jpeg-to-png', function(req, res) {
  let jpegUrl = req.query.jpegUrl;
  const filename = jpegUrl.substr(jpegUrl.lastIndexOf('/') + 1);
  const srcFilepath =  './images/download/' + filename + ".jpeg";
  const destFilepath = './images/png/' + filename + ".png";

  // TODO: cache, check against already downloaded files

  // https -> http
  jpegUrl = jpegUrl.replace(/^https:\/\//i, 'http://');

  // Retrieve image, pass to conversion
  // TODO: migrate to global host ip
  const returnUrl = `http://192.168.1.33:5001/client_controller/images/png/${filename}.png`;
  request(jpegUrl).pipe(fs.createWriteStream(srcFilepath)).on('close', () => wait(srcFilepath, destFilepath, res, returnUrl));
});

app.listen(port, () => { console.log(`m5stack REST interface: ${port}`); });
