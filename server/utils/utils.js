const express = require('express');
var cors = require("cors");
const app = express();
const port = 8005;
app.get('/', (req, res) => res.send(as))
app.use(express.json());
app.use(cors());

// Image conversion
const sharp = require("sharp");
const fs = require('fs');
const request = require('request');

// Image hosting
const imageHostPort = 8006;
const static = require('node-static');
const http = require('http');

const host = process.env.HOST;
console.log(`host: ${host}`);


// SUPPORT FUNCTIONS ----------------------------------------

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


// ENDPOINTS ----------------------------------------  

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
  const returnUrl = `http://${host}:${imageHostPort}/images/png/${filename}.png`;
  request(jpegUrl).pipe(fs.createWriteStream(srcFilepath)).on('close', () => wait(srcFilepath, destFilepath, res, returnUrl));
});


// STATIC IMAGE HOST ----------------------------------------  

const file = new(static.Server)();
http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(imageHostPort);


app.listen(port, () => { console.log(`utils REST interface: ${port}`); });
