Behringer 3216 over HTTP
========================

This is a small node.js based thing to control a Behringer DDX3216 with a web browser.

Ideally, this would run on an embedded system (e.g. a Raspberry Pi) that also provides a WiFi interface, so you could use a phone or tablet to control the desk (which supposedly sits at FOH) from, say, the stage.

It is inspired by the various control apps available for newer digital mixers.

How to use
----------

You need to have a MIDI output device on your computer. (An input device is optional.)
You also need a C++ compiler, to allow the required `midi` module to compile.
Then, just run:

```
npm install
node main
```

The first available MIDI output will be used to talk to the desk.
Due to quirks on the development setup, it will try to receive updates from the desk via the **second** MIDI input.
If a device description is available, it will be printed on startup.
You can select other devices using the command line. Run `node main --help` for a short help.

When the server is running, navigate a browser to http://localhost:9080/.

Parameters are picked up as they are changed.
You can load a preset on the desk to make all settings known to the HTTP interface.
If there exists a possibility to read the current state from the desk without a load cycle, I haven't found it yet.

How to set up your desk
-----------------------

- Enable SYSEX via MIDI: Press the "Files" Button, and in the "Exchange" tab, set "File Exchange via" to "MIDI"
- Enable Parameters: Press the "MMC/MIDI" Button, and in the "Rx/Tx" tab, enable Rx and Tx for "Direct Par.Excl.", as well as everything in the "Rx/Tx only" section.
- Connect the MIDI Out port of the desk to the input of your computer's MIDI device
- Connect the output of your computer's MIDI to the MIDI In port of the desk.

Debugging
---------

If you want more verbose output of what is happening, you can enable select debug logging channels by setting the `DEBUG` environment variable, e.g.

```
DEBUG=sysex,behringer,ddx3216http node main
```
