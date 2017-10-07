## v1.2.0

- Adds `deviceStates` event that fires right after connecting to a WebSocket,
  sending the entire state of the board.
- Changes JSON returned at `GET /buttons`
  - [BREAKING] Renames device `length` to `buttonCount`.
- Fixes a couple of bugs in pointer event handling on test page.
- Fixes really bad button mapping logic (oops!).
- Makes test page show number of buttons reported by server.
- Adds support for more than 2 devices reported by server.

## v1.1.0

- Adds support for button emulation in testmode; open another browser and click
  buttons to simulate button presses to be broadcast to other listeners.
- Adds HOST env var to set --host to listen on.
- Improves rendering of multiple button devices side-by-side.

## v1.0.1

- First release for people-who-aren't-me to try out.
- Works with real hardware; tested with a Teensy 3.0 running the button board
  firmware (see /firmware) with 2 buttons attached.
- Supports polling HTTP and evented WebSockets; see README.md for API details.
- Supports wrapping another process with `--wrap-cmd`; server and subprocess
  will start together and exit together.
- Uses `pkg` to produce standalone binaries that don't require installing
  Node.js.
