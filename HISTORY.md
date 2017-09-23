## v1.0.1

- First release for people-who-aren't-me to try out.
- Works with real hardware; tested with a Teensy 3.0 running the button board
  firmware (see /firmware) with 2 buttons attached.
- Supports polling HTTP and evented WebSockets; see README.md for API details.
- Supports wrapping another process with `--wrap-cmd`; server and subprocess
  will start together and exit together.
- Uses `pkg` to produce standalone binaries that don't require installing
  Node.js.
