# buttons-are-cool-node

## What's this nonsense, then?

This is a Node.js server that exposes the [1000 Buttons Project](http://buttonsare.cool/)
hardware as a web API. Just about every programming environment on the
planet can make web requests.

Current code returns each connected serial device's state in a JSON
list at `/buttons`. See [JSON Format](#json-format) below.

Made for the [100 Button Jam](https://itch.io/jam/100-button-game-jam).

## HOW TO: The quick and the dirty

0. Install [Node.js and npm](https://nodejs.org/en/download/current/).
1. Download this project (or clone the repo).
2. At the command line, switch to the project's folder.
3. Install yarn: `npm install -g yarn` (optional)
4. Install project dependencies: `yarn install` (or `npm install`)
5. Copy `config.json.example` to `config.json`.
6. Edit `config.json`; enter the names of your serial port(s) that have button
   controllers attached.
7. Start the server: `node index.js`
8. Visit [http://localhost:3000](http://localhost:3000) to see the debugging
   page. Verify that it responds (slowly) to button presses on your controller.

You're all set! Use any web or HTTP library in any language to connect to
[](http://localhost:3000/buttons), then decode the JSON for use in your own
software. You can even rip out the contents of `/public` and add your own
web page and javascript there.

## Hardware

This server's designed to talk to a [dirt-simple Arduino sketch](https://itch.io/jam/100-button-game-jam/topic/140791/code-code-for-the-arduino)
that polls its inputs and assembles multi-byte bitfields representing those
inputs' states. A state packet might look like:

```
02 00 00 00 00 00 00 01
```

The least-significant bit (LSB) of each byte is reserved; only the top 7 bits of
each byte represent Arduino inputs, with 1 for "button down" and 0 for "button
up". A byte with the LSB set is an end-of-message indicator, meaning you can
append it to the last 7 bytes you received and start decoding the full bitfield.

## Upsides

- Every development platform and language has a way of talking to the web, so
  this opens the 1000 Buttons hardware up to lots of potential users.
- The server's not that complex, so it should scale well. Y'know, probably. If
  not, there's room to optimize.
- I got to play with neato Javascript features like async/await, generators, and
  iterables when I was implementing the server.

## Downsides

- Untested with the real hardware as of this writing (2017-09-19).
- Latency. You can poll pretty fast, but you can't possibly poll the server fast
  enough for a fighting game to feel good. Maybe there are other kinds of games
  you could make?
- Setup. Ya gotta get Node.js running on your local machine. Probably not harder
  than getting the Arduino IDE set up.

## JSON Format

Here's an example JSON payload returned from a GET request to `/buttons`
(trimmed for brevity). The button list is an object with numeric keys because
all button numbers can be remapped non-consecutively via XML. Stock config uses
the XML mappings from the 100 Buttons [sample Unity project](https://github.com/supersoulstudio/100ButtonsExample).

```json
{
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

- Add websocket support with socket.io. Should be a piece of cake and way more
  responsive with individual button events.
- Refactor the serial port code out of `index.js`. It's kinda ugly.
- Add a testing mode that sends fake button mashing events.

Less-likely stuff:

- Add support for server-sent events?
- Add support for [gRPC](http://grpc.io)?
- Add support for stdout?
- Add support for named pipes (Linux, Mac)?
- Add support for ZeroMQ?
- Add support for IFTTT?
- Add an example Electron desktop app project?
- Turn this into an npm package, maybe? I dunno.

## LICENSE

This code is licensed under the [WTFPL](http://www.wtfpl.net/). See
[LICENSE](/LICENSE) for details.
