
var debug = require('debug')('behringer');

/**
 * 
 * @param {number} channel_number
 * @param {Behringer} connection
 * @returns {Channel}
 */
var Channel = function (channel_number, connection) {
    this.channel = channel_number - 1;
    this.connection = connection;
    this.volume_db = -80;
    this.aux = [
        {db: -80, pre: false},
        {db: -80, pre: false},
        {db: -80, pre: false},
        {db: -80, pre: false}
    ];
};

Channel.prototype.setAuxSend = function(aux_ch, db) {
    this.aux[aux_ch - 1].pre = isPre;
    // aux1=70, aux2=72, ...
    var parameterNumber = ((aux_ch - 1) * 2) + 70;
    var dBValue = this.fullrangeValue(db);
    var sysex = this.paramChange(parameterNumber, dBValue);
    this.connection.sendCommand(sysex);
};

Channel.prototype.setAuxPre = function(aux_ch, isPre) {
    this.aux[aux_ch - 1].pre = isPre;
    // pre-post aux1=71, aux2=73, ...
    var parameterNumber = ((aux_ch - 1) * 2) + 71;
    var sysex = this.paramChange(parameterNumber, isPre ? 1 : 0);
    this.connection.sendCommand(sysex);
};

Channel.prototype.setVolume = function(dB) {
    this.volume_db = dB;
    var sysex = this.paramChange(1, this.fullrangeValue(dB));
    this.connection.sendCommand(sysex);
}

Channel.prototype.fullrangeValue = function(db_fraction) {
    var unboundedValue = Math.round((db_fraction + 80) * 16);
    // clamp to 0-1472
    var parameterValue = Math.max(0, Math.min(unboundedValue, 1472));
    return parameterValue;
};

Channel.prototype.paramChange = function(parameter, parameterValue) {
    var sysex = [];
    sysex.push(0x20); // function code, 20 = parameter change
    sysex.push(1); // number of parameter changes (up to 23)
    sysex.push(this.channel);
    sysex.push(parameter);
    var low7bit  = parameterValue & 0x7F;
    var high7bit = (parameterValue >> 7) & 0x7F;
    sysex.push(high7bit, low7bit);
    return sysex;
};

Channel.prototype.setFromMidi = function(param, high, low) {
    var rawValue = (high << 7) | low;
    switch(param) {
        case 1: // volume
            var db = Math.round((rawValue / 16) - 80);
            this.volume_db = db;
            debug("Channel", this.channel, "set volume", db, "dB");
            break;
        case 70:
        case 72:
        case 74:
        case 76:
            var aux = (param - 70) / 2;
            this.aux[aux].db = Math.round((rawValue / 16) - 80);
            debug("Channel", this.channel, "set aux", aux, "send", this.aux[aux].db, "dB");
            break;
        case 71:
        case 73:
        case 75:
        case 77:
            var aux = (param - 71) / 2;
            this.aux[aux].pre = (rawValue === 1);
            debug("Channel", this.channel, "set aux", aux, "pre", this.aux[aux].pre);
            break;
    }
};

/**
 * 
 * @param {any} out
 * @param {number} deviceChannel
 * @returns {Behringer}
 */
var Behringer = function (out, deviceChannel, input) {
    this.midi_out = out;
    Behringer.prototype.setDeviceChannel.call(this, deviceChannel);
    Behringer.prototype.createChannels.call(this);
    if (input) {
        Behringer.prototype.initMidiReceive.call(this, input);
    }
};

Behringer.prototype.setDeviceChannel = function(channel) {
    // 0ab0 cccc; a=ignore AppID, b=ignore Channel, c=Channel
    if (channel === undefined) {
        this.deviceByte = 0x60; // ignore appID, ignore channel
    } else {
        var highNibble  = 0x40; // ignore appID
        var lowNibble   = channel & 0x0F;
        this.deviceByte = highNibble | lowNibble;
    }
};

Behringer.prototype.initMidiReceive = function (midi_in) {
    this.midi_in = midi_in;
    this.midi_in.on("message", this.receiveMidiInput.bind(this));
};

Behringer.prototype.createChannels = function() {
    this.channels = [];
    for (var channel_number = 1; channel_number < 33; channel_number++) {
        this.channels[channel_number] = new Channel(channel_number, this);
    }
};

Behringer.prototype.receiveMidiInput = function (deltaT, message) {
    if (this.isInterestingMessage(message)) {
        this.decodeMidiMessage(message);
    }
};

Behringer.prototype.isInterestingMessage = function(midi) {
    if (midi.length < 8) return false;  // too short
    if (midi[0] !== 0xF0) return false; // not sysex
    if (midi[2] !== 0x20 || midi[3] !== 0x32) return false; // no behringer
    // TODO: check device address
    return true;
};

Behringer.prototype.decodeMidiMessage = function(midi) {
    var fn_code = midi[6];
    switch (fn_code) {
        case 0x20:
            var payload = midi.splice(7);
            this.decodeMidiParChangeSet(payload);
            break;
    }
};

Behringer.prototype.decodeMidiParChangeSet = function(payload) {
    var n_params = payload[0];
    debug("Received", n_params, "parameters");
    for (var i = 0; i < n_params; i++) {
        var channel = payload[4*i+1] + 1; // 0-based from midi to 1-based here
        var param = payload[4*i+2];
        var high_word = payload[4*i+3];
        var low_word = payload[4*i+4];
	
	if (!this.channels[channel]) {
            debug("Missing Channel", channel);
        } else {
            this.channels[channel].setFromMidi(param, high_word, low_word);
        }
    }
};

Behringer.prototype.channel = function(channel_number) {
    return this.channels[channel_number];
};

Behringer.prototype.ping = function() {
    this.sendCommand(this.assembleCommand([0x40]));
};

Behringer.prototype.requestMeterData = function() {
    this.sendCommand(this.assembleCommand([0x4F]));
};

Behringer.prototype.sendCommand = function (commandBytes) {
    var sysexBytes = this.assembleCommand(commandBytes);
    debug("Sending SysEx:", sysexBytes.map(function(n){return n.toString(16);}));
    this.midi_out.sendMessage(sysexBytes);
};

Behringer.prototype.assembleCommand = function(commandBytes) {
    var sysex = [];
    sysex.push(0xF0); // sysex
    sysex.push(0x00); // for manufacurer
    sysex.push(0x20, 0x32); // Behringer
    sysex.push(this.deviceByte);
    sysex.push(0x0B); // device, DDX3216
    for (var byte in commandBytes) {
        sysex.push(commandBytes[byte]);
    }
    sysex.push(0xF7);
    return sysex;
};

module.exports = exports = Behringer;
