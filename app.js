// npm install express
// npm install socket.io

var sys         = require('sys');
var express = require('express');
var pem = require('pem');
var http = require('http');
var https = require('https');

pem.createCertificate({days:1, selfSigned:true}, function(err, keys) {
      var app = express();
      var server = http.createServer(app);
      var httpsServer = https.createServer({key: keys.serviceKey, cert:keys.certificate}, app);
      /*var io          = require('socket.io');*/
      app.use(express.static(__dirname + '/public'));
      
      server.listen(3000);
      httpsServer.listen(8443);

      var Communicator = require('MaxComm');
      var comm = new Communicator(4300,server);

                      });

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
