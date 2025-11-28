var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var midi = require('midi');
var debug = require('debug')('ddx3216http')
var argparse = require('argparse');

const parse = new argparse.ArgumentParser({description: 'DDX3216http'});
parse.add_argument("-l","--list", { help: 'List MIDI devices', action: 'store_const', const: true, default: false });
parse.add_argument("-d","--dev", { help: 'Use Device number (1..16)', type: 'int', default: undefined });
parse.add_argument("-i","--input", { help: 'Use Device <INPUT> for input', type: 'int', default: 1 });
parse.add_argument("-o","--output", { help: 'Use Device <INPUT> for output', type: 'int', default: 0 });
var args = parse.parse_args();

var output = new midi.output();
var input = new midi.input();

if (args.list) {
  console.log("Device List:");
  var inputCount = input.getPortCount();
  for (var i = 0; i < inputCount; i++) console.log("Input "+i+": "+input.getPortName(i));
  var outputCount = output.getPortCount();
  for (var i = 0; i < outputCount; i++) console.log("Output "+i+": "+input.getPortName(i));
  process.exit(0);
}

if (output.getPortCount() < 1) {
    console.log("No midi outs.");
    process.exit(1);
}
console.log("Sending on MIDI port", args.output, ":", output.getPortName(args.output));
output.openPort(args.output);

if (input.getPortCount() < (args.input + 1)) {
    console.log("Input Port", args.input, "not available. Not listening.");
} else {
    console.log("Receiving on MIDI port", args.input, input.getPortName(args.input));
    input.openPort(args.input);
    input.ignoreTypes(false,true,true);
}

if (args.dev !== undefined) {
    console.log("Using Device ", args.dev);
    args.dev -= 1;
} else {
    console.log("Sending for all devices");
}
var behringer = require('./behringer');
var desk = new behringer(output, args.dev, input);

app.use("/", express.static("public_html"));

io.on('connection', function(socket){
  debug('a user connected');
  socket.on('aux', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "Aux", cmd.parameter, "@", cmd.value);
      desk.channel(cmd.channel).setAuxSend(cmd.parameter, cmd.value);
  });
  socket.on('fx', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "Fx", cmd.parameter, "@", cmd.value);
      desk.channel(cmd.channel).setFxSend(cmd.parameter, cmd.value);
  });
  socket.on('vol', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "@ vol", cmd.value);
      desk.channel(cmd.channel).setVolume(cmd.value);
  });
  socket.on('mute', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "@ mute", cmd.value);
      desk.channel(cmd.channel).setMute(cmd.value);
  });
  socket.on('pan', function (message) {
      var cmd = JSON.parse(message);
      debug("Ch", cmd.channel, "@ pan", cmd.value);
      desk.channel(cmd.channel).setPan(cmd.value);
  });
  socket.on('get', function (message, cb) {
      var cmd = JSON.parse(message);
      debug("Get", cmd);
      var channel = desk.channel(cmd.channel);
      switch (cmd.setting) {
          case "vol":
              cb(channel.getVolume());
              break;
          case "mute":
              cb(channel.getMute());
              break;
          case "pan":
              cb(channel.getPan());
              break;
          case "aux":
              cb(channel.getAuxSend(cmd.parameter), cmd.parameter);
              break;
          case "fx":
              cb(channel.getFxSend(cmd.parameter), cmd.parameter);
              break;
      }
  });
});

desk.ping();
desk.events.on('midi', function(param) {
    var ch = param.channel.channel+1;
    debug('Forward Midi to Web: ', ch, param.setting, param.parameter, param.value);
    var parameter = param.parameter;
    if (parameter !== undefined) {
        parameter += 1;
    }
    io.emit('midi', {
        channelNumber: ch,
        setting: param.setting,
        parameter: parameter,
        value: param.value
    });
})
desk.requestMeterData();

var port = 9080;
http.listen(port, function(){
  console.log('listening on *:'+port+', you can open http://localhost:'+port+' to connect.');
});
