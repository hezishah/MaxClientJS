// npm install express
// npm install socket.io

var sys         = require('sys');
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io          = require('socket.io'); 

app.use(express.static(__dirname + '/public'));

server.listen(3000);

/*var socket = io.listen(server);

socket.on('connection', function (client){ 
  // new client is here!
  console.log("Connected");

  client.on('message', function () {
	console.log("got message");
  }) ;

  client.on('disconnect', function () {
  });
});
*/
var Communicator = require('node-MaxComm');
var comm = new Communicator(4300,server);