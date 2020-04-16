const express = require('express');
var cors = require("cors");
const http = require('http');
const webSocketServer = require('websocket').server;

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