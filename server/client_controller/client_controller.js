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
  clientsLog((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  clientsLog('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))
  
  // Display ID on LCD
  connection.sendUTF("{ \"command\": \"text\", \"text\":\"" + userID + "\", \"x\": 10, \"y\": 10 }")

  connection.on('message', function(message) {
    clientsLog("[" + userID + "] " + "message: " + message.utf8Data);

    if(frontend != null) {
      const focus = JSON.parse(message.utf8Data)["focus"];
      const json = { id: Number(userID), focus: focus }
      frontend.sendUTF(JSON.stringify(json));
    }
  });

  connection.on('close', function(reasonCode, description) {
    clientsLog("[" + userID + "] " + "close: " + description + " (" + reasonCode + ")");
    //delete clients[userID];
  });

  clientsWsServer.on('close', function(connection) {
    clientsLog((new Date()) + " Peer " + userID + " disconnected.");
    //delete clients[userID];
  });
});

frontendWsServer.on('request', function(request) {
  const connection = request.accept(null, request.origin);
  frontend = connection;
  frontendLog((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  
  frontendWsServer.on('close', function(connection) {
    frontendLog((new Date()) + " Frontend disconnected.");
    frontend = null;
  });
});


// ENDPOINTS ----------------------------------------  

app.post('/send/image', function(req, res) {
  var ID = req.query.ID;
  var pngUrl = req.query.pngUrl;
  var x = Number(req.query.x);
  var y = Number(req.query.y);

  const json = { command:"pngUrl", url:pngUrl, x:x, y:y };
  console.log("[image] [" + ID + "] " + JSON.stringify(json));

  clients[ID].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.post('/send/text', function(req, res) {
  var ID = req.query.ID;
  var text = req.query.text;
  var x = Number(req.query.x);
  var y = Number(req.query.y);

  const json = { command:"text", text:text, x:x, y:y };
  console.log("[text] [" + ID + "] " + JSON.stringify(json));

  clients[ID].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.get('/client/list', function(req, res) {
  res.json(Object.keys(clients));
});

app.listen(port, () => console.log(`m5stack REST interface: ${port}`))
