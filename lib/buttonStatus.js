'use strict';
const EventEmitter = require('events').EventEmitter;
const Bitfield = require('./bitfield');

class ButtonStatus extends EventEmitter {
  constructor(mapping, packetByteLength = 8) {
    super();
    this.mapping = mapping;
    this.state = new Bitfield(new Buffer(packetByteLength));
    this.oldState = new Bitfield(new Buffer(packetByteLength));
    this.dataQueue = new Buffer(0);
  }

  update(data) {
    // Update queue with incoming data.
    this.dataQueue = Buffer.concat([this.dataQueue, data]);

    const state = this.state;
    const oldState = this.oldState;
    let dataQueue = this.dataQueue;

    // Sentinel bytes have a 1 in their LSB, meaning a sequence is complete.
    let seqCount = dataQueue.filter(byte => byte & 1).length;
    if (seqCount === 0) return;

    // Process each buffered sequence.
    for (let seqNum = 0; seqNum < seqCount; seqNum++) {
      // Move current state to old state.
      state.copyTo(oldState);
      state.copyFrom(dataQueue);
      dataQueue = dataQueue.slice(state.length);
      this._triggerEvents()
    }
    this.dataQueue = dataQueue;
  }

  isPressed(i) {
    return !!this.state.at(i);
  }

  toJSON() {
    let mappedStates = { length: 0, buttons: {} };
    for (let buttonIdx = 0; buttonIdx < this.state.length; buttonIdx++) {
      if (this.mapping[buttonIdx] === undefined) continue;
      let mappedButtonIdx = this.mapping[buttonIdx];
      mappedStates.buttons[mappedButtonIdx] = this.isPressed(buttonIdx);
      mappedStates.length++;
    }
    return mappedStates;
  }

  _triggerEvents() {
    for (let {index, value} of this._changedList()) {
      this.emit(value ? 'buttonDown' : 'buttonUp', this.mapping[index]);
    }
  }

  _changedList() {
    return this.state.xor(this.oldState);
  }
}
module.exports = ButtonStatus;
