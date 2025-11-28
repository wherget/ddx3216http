Behringer DDX3216 over HTTP
========================

This is a Node.js based server and user interface to control a Behringer DDX3216 with a web browser.

Use cases
---------

Ideally this would run on an embedded system (e.g. a Raspberry Pi) that also provides a WiFi interface, so you could use a phone or tablet to control the desk (which probably sits at FOH) from, say, the stage.

Or if you integrate your MIDI devices with a MIDI router, f.ex. the MioXL, via RTP into a LAN or even WAN, this script can run on any server in your RTP network. You can use [rtpmidid](https://github.com/davidmoreno/rtpmidid) on the server to make a RTP midi port available for this script.

It is inspired by the various control apps available for newer digital mixers.

Features
----------

* 64 volume faders on 4 pages (Ch 1-16, Ch 17-23, Bus 1-16, Aux/Fx)
* dB fine tune buttons
* 8 sends (Aux/Fx) on each channel
* Pan
* Mute
* Editable channel names
* Multitouch faders
* Fullscreen mode
* Great UI name

![Uli Master 3216 UI Screenshot](screenshot-ulimaster.png "Uli Master DDX3216 UI Screenshot")

How to use
----------

You need to have a MIDI output device on your computer/server. (An input device is optional.)
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

```
usage: main.js [-h] [-l] [-d DEV] [-i INPUT] [-o OUTPUT]

DDX3216http

optional arguments:
  -h, --help            show this help message and exit
  -l, --list            List MIDI devices
  -d DEV, --dev DEV     Use Device number (1..16)
  -i INPUT, --input INPUT
                        Use Device <INPUT> for input
  -o OUTPUT, --output OUTPUT
                        Use Device <INPUT> for output
```

When the server is running, navigate a browser to http://localhost:9080/ or respectively your private LAN address.

Parameters are picked up as they are changed.
You can load a preset on the desk to make all settings known to the HTTP interface.
If there exists a possibility to read the current state from the desk without a load cycle, I haven't found it yet.

How to set up your desk
-----------------------

- Enable SYSEX via MIDI: Press the "Files" Button, and in the "Exchange" tab, set "File Exchange via" to "MIDI"
- Enable Parameters: Press the "MMC/MIDI" Button, and in the "Rx/Tx" tab, enable Rx and Tx for "Direct Par.Excl.", as well as everything in the "Rx/Tx only" section.
- Connect the MIDI Out port of the desk to the input of your computer's MIDI device
- Connect the output of your computer's MIDI to the MIDI In port of the desk.

Compability
-----------

For __mobile devices__ you need __at least Chrome 140, Firefox Mobile or a recent Safari for iOS__. The web ui should work on every modern desktop browser though.

Debugging
---------

If you want more verbose output of what is happening, you can enable select debug logging channels by setting the `DEBUG` environment variable, e.g.

```
DEBUG=sysex,behringer,ddx3216http node main
```
