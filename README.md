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
