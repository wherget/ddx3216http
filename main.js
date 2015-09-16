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

var input = new midi.input();
if (input.getPortCount() > 1) {
    console.log("Receiving on midi in", input.getPortName(1));
    input.openPort(1);
    input.ignoreTypes(false,true,true);
    input.on('message', function(deltaTime, message) {
        console.log('m:' + message);
    });
} else {
    console.log("Not listening.");
}

var behringer = require('./behringer');
var desk = new behringer(output, undefined, input);

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

desk.ping();
desk.requestMeterData();

http.listen(9080, function(){
  console.log('listening on *:9080');
});