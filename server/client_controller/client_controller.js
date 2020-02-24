// Websockets
const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

// Express
const express = require('express');
const app = express();
const port = 8001;
app.get('/', (req, res) => res.send(as))
app.use(express.json());


const clients = {};

const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

wsServer.on('request', function(request) {
  var userID = getUniqueID();
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))

  connection.on('message', function(message) {
    console.log("message: ", message);
  });

  wsServer.on('close', function(connection) {
    console.log((new Date()) + " Peer " + userID + " disconnected.");
    delete clients[userID];
  });
});

app.post('/send/image', function(req, res) {
  var ID = req.query.ID;
  var pngUrl = req.query.pngUrl;
  var x = req.query.x;
  var y = req.query.y;

  const json = { command:"pngUrl", url:pngUrl, x:x, y:y };
  console.log(json);

  clients[ID].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.post('/send/text', function(req, res) {
  var ID = req.query.ID;
  var text = req.query.text;
  var x = Number(req.query.x);
  var y = Number(req.query.y);

  const json = { command:"text", text:text, x:x, y:y };
  console.log(json);

  clients[ID].sendUTF(JSON.stringify(json));
  
  res.status(200).send();
});

app.listen(port, () => console.log(`m5stack REST interface: ${port}`))
