# buttons-are-cool-node

## What's this nonsense, then?

This is a Node.js server that exposes [@barelyconcealed](https://twitter.com/barelyconcealed)'s
[1000 Button Project](http://buttonsare.cool/) hardware as a web API. Just
about every programming environment on the planet can make web requests.

Current code provides a WebSocket endpoint for fast button press events. It also
returns each connected serial device's state in a JSON list at
`http://localhost:3000/buttons`, in case you'd rather use HTTP GET requests to
access the API. (See [JSON Format](#json-format) below.)

There's a demo page at `/public/index.js` that has examples of WebSockets and
HTTP polling for reading button events.

Made for the [100 Button Jam](https://itch.io/jam/100-button-game-jam).

## HOW TO: The quick and the dirty

0. Install [Node.js and npm](https://nodejs.org/en/download/current/).
1. Download the [latest release](https://github.com/mildmojo/buttons-are-cool-node/releases) (or use the green button at the top right to download or [clone](https://help.github.com/articles/which-remote-url-should-i-use/) the repo).
2. At the command line, switch to the project's folder.
3. Install yarn: `npm install -g yarn` (optional)
4. Install project dependencies: `yarn install` (or `npm install`)
5. Copy `config.json.example` to `config.json`.
6. Edit `config.json`; enter the names of your serial port(s) that have button
   controllers attached.
7. Start the server in test mode: `yarn run test-server` (or `npm run test-server`)
8. Visit http://localhost:3000 to see the debugging
   page. Buttons should flicker as the server simulates activity.
9. Start the server with the button board attached: `yarn run server`
10. Reload http://localhost:3000 and see that pressing buttons updates the UI.

You're all set! Use any web or HTTP library in any language to connect to
http://localhost:3000/buttons, then decode the JSON for use in your own
software. You can even rip out the contents of `/public` and add your own
web page and javascript there. The server serves any files in `/public`.

Or use WebSockets. Connect to ws://localhost:3000 and listen for button press
events. They're faster and more efficient than polling.

### Configuration

See [config.json.example](/config.json.example) for details.

## Hardware

This server's designed to talk to a [dirt-simple Arduino sketch](/firmware/100buttons/100buttons.ino)
([original](https://itch.io/jam/100-button-game-jam/topic/140791/code-code-for-the-arduino))
that polls its inputs and assembles multi-byte bitfields representing those
inputs' states. A complete state packet might look like:

```
02 00 00 00 00 00 00 01
```

The least-significant bit (LSB) of each byte is reserved; only the top 7 bits of
each byte represent Arduino inputs, with 1 for "button down" and 0 for "button
up". A byte with the LSB set is an end-of-message indicator, meaning you can
append it to the last 7 bytes you received and start decoding the full bitfield.

## Upsides of a Web API

- Every development platform and language has a way of talking to the web, so
  this opens the 1000 Buttons hardware up to lots of potential users.
- The server's not that complex, so it should scale well. Y'know, probably. If
  not, there's room to optimize.
- I got to play with neato Javascript features like async/await, generators, and
  iterables when I was implementing the server.

## Downsides of a Web API

- Untested with the real hardware as of this writing (2017-09-19).
- Polling latency. You can poll pretty fast, but you can't possibly poll the
  server fast enough for a fighting game to feel good. Definitely use WebSockets
  if you can. If not, maybe there are other kinds of games you could make?
- Setup. Ya gotta get Node.js running on your local machine. Probably not harder
  than getting the Arduino IDE set up.

## WebSocket events

The WebSocket address is `ws://localhost:3000/`.

WebSocket events arrive as stringified JSON to the WebSocket's `onmessage`
handler. The JSON objects represent events. Events have a `name` and other
associated attributes.

Examples:

```
{
  name: 'buttonUp',
  deviceNum: 0,
  deviceName: 'COM1',
  buttonNum: 8
}

{
  name: 'buttonDown',
  deviceNum: 1,
  deviceName: 'COM2',
  buttonNum: 5
}

{
  name: 'testMode',
  isTestMode: true
}
```

## JSON Format

Here's an example JSON payload returned from a GET request to `/buttons`
(trimmed for brevity). The button list is an object with numeric keys because
all button numbers can be remapped non-consecutively via XML. Stock config uses
the XML mappings from the 100 Buttons [sample Unity project](https://github.com/supersoulstudio/100ButtonsExample).

```json
{
 "testMode": true,
 "devices": [
  {
   "length": 4,
   "buttons": {
    "3": false,
    "4": false,
    "5": false,
    "6": false
   },
   "name": "COM1"
  },
  {
   "length": 4,
   "buttons": {
    "2": false,
    "3": false,
    "4": false,
    "5": false
   },
   "name": "COM2"
  }
 ]
}
```

## TODO

Likely stuff:

- Refactor the serial port code out of `index.js`. It's kinda ugly.
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
