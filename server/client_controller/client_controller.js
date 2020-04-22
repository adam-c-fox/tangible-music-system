// Websockets
const webSocketServer = require('websocket').server;
const webSocketClient= require('websocket').client;
const http = require('http');
const wsClient = new webSocketClient();

// WS - Clients 
const clientsWsPort = 8000;
const clientsServer = http.createServer();
clientsServer.listen(clientsWsPort);
const clientsWsServer = new webSocketServer({
  httpServer: clientsServer
});

// Express
const express = require('express');
var cors = require("cors");
const app = express();
const port = 8002;
app.get('/', (req, res) => res.send(as))
app.use(express.json());
app.use(cors());

// Business logic
const axios = require('axios');
const connections = {};
const macToConnections = new Map();
let nfcToMac = new Map();
nfcToMac.set(89, 'A4:CF:12:76:9A:A8');
nfcToMac.set(95, '80:7D:3A:DB:D9:24');
nfcToMac.set(108, '24:6F:28:AE:99:9C');

const host = process.env.HOST;
console.log(`host: ${host}`);

function clientsLog(text) {
  console.log('[clients] ' + text);
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
    } else /*if(frontend != null)*/ {
      const json = { id: Number(userID), mac: msgContents['mac'], focus: msgContents['focus'] }
      axios.post('http://localhost:8003/frontend/send', { payload: json })
    }
  });

  connection.on('close', function(reasonCode, description) {
    clientsLog(`[${userID}] close: ${description} (${reasonCode})`);
  });

  clientsWsServer.on('close', function(connection) {
    clientsLog(`${new Date()} Peer ${userID} disconnected.`);
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

  const json = { nfc: nfcToMac.get(Number(tag)) };
  axios.post('http://localhost:8003/nfc/currently-playing', { payload: json })

  res.status(200).send();
});


app.listen(port, () => { console.log(`m5stack REST interface: ${port}`); });
