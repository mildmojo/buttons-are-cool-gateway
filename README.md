# buttons-are-cool-gateway

![Screenshot of new UI](https://user-images.githubusercontent.com/103495/31005870-8382c74a-a4c8-11e7-8c95-155f8edd3460.png)

## What's this nonsense, then?

This is a Node.js server that exposes [@barelyconcealed](https://twitter.com/barelyconcealed)'s
[1000 Button Project](http://buttonsare.cool/) hardware as a web API available
over HTTP and/or WebSockets. Just about every programming environment on the
planet can make web requests.

Made for the [100 Button Jam](https://itch.io/jam/100-button-game-jam).

## HOW TO: Quick start, *no* hardware

0. Download the latest [binary release](https://github.com/mildmojo/buttons-are-cool-gateway/releases).
1. Unzip it.
2. Copy `config.json.example` to `config.json`.
3. Start the server by running `buttons-are-cool-gateway --testmode`
4. Visit http://localhost:3000 to view the test UI.
5. Open the same link in another tab/browser/device. Tapping button numbers in
   the second copy will make those buttons light up in the first copy. Use this
   later to test your application.

## HOW TO: Quick start *with* hardware

0. Download the latest [binary release](https://github.com/mildmojo/buttons-are-cool-gateway/releases).
1. Unzip it.
2. Copy `config.json.example` to `config.json` and edit it. Enter the serial
   port(s) the button board is connected to. (You can list all available serial
   ports by running `buttons-are-cool-gateway --list`.)
3. Start the server by running `buttons-are-cool-gateway`.
4. Visit http://localhost:3000 to see a live visualization of the button board's
   current state.

### Congrats!

You're all set! Use any web or HTTP library in any language to connect to
http://localhost:3000/buttons, then decode the JSON for use in your own
software. You can even rip out the contents of `/public` and add your own
web page and javascript there. The server serves any files in `/public`.

Or use WebSockets. Connect to ws://localhost:3000 and listen for button press
events. They're faster and more efficient than polling.

## HOW TO: Set up development environment for working on the server

If you want to modify the server, follow these instructions to set up your
development environment.

0. Install [Node.js and npm](https://nodejs.org/en/download/current/).
1. Download the [latest release](https://github.com/mildmojo/buttons-are-cool-gateway/releases) (or use the green button at the top right to download or [clone](https://help.github.com/articles/which-remote-url-should-i-use/) the repo).
2. At the command line, switch to the project's folder.
3. Install yarn: `npm install -g yarn` (optional)
4. Install project dependencies: `yarn install` (or `npm install`)
5. Copy `config.json.example` to `config.json`.
6. Edit `config.json`; enter the names of your serial port(s) that have button
   controllers attached. (Leave the defaults if you're testing without hardware.)
7. Start the server in test mode: `yarn run test-server` (or `npm run test-server`)
8. Visit http://localhost:3000 to see the test page.
9. (with hardware attached) Start the server with the button board attached:
   `yarn run server`
10. (with hardware attached) Reload http://localhost:3000 and see that pressing
    buttons updates the UI.

### Configuration

See [config.json.example](/config.json.example) for details.

## Hardware

This server's designed to talk to a [dirt-simple Arduino sketch](/firmware/100buttons/100buttons.ino)
([original](https://itch.io/jam/100-button-game-jam/topic/140791/code-code-for-the-arduino))
that polls input pins and assembles multi-byte bitfields representing those
inputs' states. A complete state packet might look like:

```
02 00 00 00 00 00 00 01
```

Bytes arrive in that order, left to right. The least-significant bit (LSB) of
each byte is reserved; only the top 7 bits of each byte represent Arduino
inputs, with 1 for "button down" and 0 for "button up". A byte with the LSB set
is an end-of-message indicator, meaning you can append it to the last 7 bytes
you received and start decoding the full bitfield.

Each Arduino can serve around 50 buttons. The 100-button board uses two Arduinos
that appear as separate serial ports. This server treats each as a separate,
numbered device with its own buttons.

## Upsides of a Web API

- Every development platform and language has a way of talking to the web, so
  this opens up the 1000 Buttons hardware to lots of potential users.
- The server's not that complex, so it should scale well. Y'know, probably. If
  not, there's room to optimize.
- I got to play with neato Javascript features like async/await, generators, and
  iterables when I was implementing the server.

## Downsides of a Web API

- Polling latency if you're not using WebSockets. You can poll pretty fast, but
  you can't possibly poll ths server fast enough for a fighting game to feel
  good. Definitely use WebSockets if you can. If not, maybe there are other
  kinds of games you could make?

## WebSocket events

The WebSocket address is `ws://localhost:3000/`.

WebSocket events arrive as stringified JSON to the WebSocket's `onmessage`
handler. The JSON objects represent events. Events have a `name` and other
associated attributes.

### deviceStates

Sent once, immediately after connecting to the server. Lists the states of all
devices and the buttons attached to them. You can get the same information with
an HTTP GET to `/buttons`.

```json
{
  "name": "deviceStates",
  "devices": [
    {
      "name": "COM1",
      "buttonCount": 4,
      "buttons": [
        false,
        false,
        false,
        false
      ]
    },
    {
      "name": "COM2",
      "buttonCount": 4,
      "buttons": [
        false,
        false,
        false,
        false
      ]
    }
  ]
}
```

### testMode

Sent once, immediately after connecting to the server. Indicates whether the
server was started with `--testmode`. In test mode, the server doesn't try to
open serial ports to talk to real button board hardware.

```json
{
  "name": "testMode",
  "isTestMode": true
}
```

### buttonDown

Sent when a button is pressed.

```json
{
  "name": "buttonDown",
  "deviceNum": 1,
  "deviceName": "COM2",
  "buttonNum": 5
}
```

### buttonUp

Sent when a button is released.

```json
{
  "name": "buttonUp",
  "deviceNum": 0,
  "deviceName": "COM1",
  "buttonNum": 8
}
```

## HTTP API, JSON Format

Here's an example JSON payload returned from a regular GET request to `/buttons`
(trimmed for brevity). The button list is an object with numeric keys because
all button numbers can be remapped non-consecutively via XML. Stock config uses
the XML mappings from the 100 Buttons [sample Unity project](https://github.com/supersoulstudio/100ButtonsExample).

```json
{
  "testMode": true,
  "devices": [
    {
      "name": "COM1",
      "buttonCount": 4,
      "buttons": [
        false,
        false,
        false,
        false
      ]
    },
    {
      "name": "COM2",
      "buttonCount": 4,
      "buttons": [
        false,
        false,
        false,
        false
      ]
    }
  ]
}
```

## TODO

Likely stuff:

- Deprecate the XML button mappings in favor of `config.json` settings.

Less-likely stuff:

- Add support for server-sent events?
- Add support for [gRPC](http://grpc.io)?
- Add support for stdout?
- Add support for named pipes (Linux, Mac)?
- Add support for ZeroMQ?
- Add support for IFTTT?
- Add an example Electron desktop app project?
- Turn this into an npm package, maybe? I dunno.

## Thanks

- Thanks to [@barelyconcealed](https://twitter.com/barelyconcealed) for a cool
  and ambitious [hardware project](http://buttonsare.cool). So many buttons.
- [Super Soul](http://supersoul.co) for the example [Unity project](https://github.com/supersoulstudio/100ButtonsExample)
  I examined for info about decoding the serial protocol

## LICENSE

This code is licensed under the [WTFPL](http://www.wtfpl.net/). See
[LICENSE](/LICENSE) for details, then Do What You Want.

I like getting credit when you use my stuff, but in this case, you do you.
