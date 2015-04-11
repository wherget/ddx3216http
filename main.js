var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var midi = require('midi');
var debug = require('debug')('ddx3216http')

var output = new midi.output();
if (output.getPortCount() < 1) {
    console.log("No midi outs.");
    process.exit(1);
}
console.log("Sending on midi out", output.getPortName(0));
output.openPort(0);

var behringer = require('./behringer');
var desk = new behringer(output);

app.use("/", express.static("public_html"));

io.on('connection', function(socket){
  debug('a user connected');
  socket.on('aux', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "Aux", cmd.parameter, "@", cmd.value);
      desk.channel(cmd.channel).setAuxSend(cmd.parameter, cmd.value);
  });
  socket.on('vol', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "@", cmd.value);
      desk.channel(cmd.channel).setVolume(cmd.value);
  });
});

http.listen(9080, function(){
  console.log('listening on *:9080');
});