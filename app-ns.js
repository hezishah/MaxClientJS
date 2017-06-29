// npm install express
// npm install socket.io

var sys         = require('sys');
var express = require('express');
var http = require('http');
var https = require('https');

      var app = express();
      var server = http.createServer(app);
      app.use(express.static(__dirname + '/public'));
      
      server.listen(3000);

      var Communicator = require('MaxComm');
      var comm = new Communicator(4300,server);
