Behringer 3216 over HTTP
========================

This is a small node.js based thing to control a Behringer DDX3216 with a web browser.

Ideally, this would run on an embedded system (e.g. a Raspberry Pi) that also provides a WiFi interface, so you could use a phone or tablet to control the desk (which supposedly sits at FOH) from, say, the stage.

It is inspired by the various control apps available for newer digital mixers.

How to use
----------

You need to have a MIDI output device on your computer.
You also need a C++ compiler, to allow the required `midi` module to compile.
Then, just run:

    npm install
    node main

The first available MIDI output will be used to talk to the desk.
If a description is available, it will be printed on startup.

When the server is running, navigate a browser to http://localhost:9080/.
