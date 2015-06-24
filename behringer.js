
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
};

Channel.prototype.setAuxSend = function(aux_ch, db) {
    // aux1=70, aux2=72, ...
    var parameterNumber = ((aux_ch - 1) * 2) + 70;
    var dBValue = this.fullrangeValue(db);
    var sysex = this.paramChange(parameterNumber, dBValue);
    this.connection.sendCommand(sysex);
};

Channel.prototype.setAuxPre = function(aux_ch, isPre) {
    // pre-post aux1=71, aux2=73, ...
    var parameterNumber = ((aux_ch - 1) * 2) + 71;
    var sysex = this.paramChange(parameterNumber, isPre ? 1 : 0);
    this.connection.sendCommand(sysex);
};

Channel.prototype.setVolume = function(dB) {
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
    var high7bit = (parameterValue >>> 7) & 0x7F;
    sysex.push(high7bit, low7bit);
    return sysex;
};

/**
 * 
 * @param {any} out
 * @param {number} deviceChannel
 * @returns {Behringer}
 */
var Behringer = function (out, deviceChannel, input) {
    this.midi_out = out;
    Behringer.prototype.setDeviceChannel.apply(this, deviceChannel);
    Behringer.prototype.createChannels.apply(this);
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
