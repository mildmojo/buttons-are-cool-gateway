'use strict';
const EventEmitter = require('events').EventEmitter;
const Bitfield = require('./bitfield');

// MAPPINGS
// Mappings are key-value pairs with "actual board button number" => "Arduino pin"

class ButtonStatus extends EventEmitter {
  constructor(mapping, packetByteLength = 8) {
    super();
    this.mapping = mapping;
    this.mapHwToLogical = mapping;
    this.mapLogicalToHw = invertArray(mapping);
    // Bitfield states directly represent hardware state with hardware pin numbers.
    // These need to be looked up in `this.mapping` to get the logical software
    // button numbers.
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

  set(buttonNum, value) {
    this.state.copyTo(this.oldState);
    const hardButtonNum = this.mapLogicalToHw[buttonNum];
    this.state = this.state.setAt(hardButtonNum, value);
    this._triggerEvents();
  }

  isPressed(i) {
    return !!this.state.at(this.mapLogicalToHw[i]);
  }

  toBitfield() {
    const newBitfield = new Bitfield(this.state.length);
    newBitfield.copyFrom(this.state);
    return newBitfield;
  }

  toJSON() {
    let mappedStates = { length: 0, buttons: {} };
    for (let buttonIdx = 0; buttonIdx < this.state.length; buttonIdx++) {
      let mappedButtonIdx = this.mapLogicalToHw[buttonIdx];
      if (mappedButtonIdx === undefined) continue;
      mappedStates.buttons[mappedButtonIdx] = this.isPressed(buttonIdx);
      mappedStates.length++;
    }
    return mappedStates;
  }

  _triggerEvents() {
    for (let {index, value} of this._changedList()) {
      this.emit(value ? 'buttonDown' : 'buttonUp', this.mapHwToLogical[index]);
    }
  }

  _changedList() {
    return this.state.xor(this.oldState);
  }
}
module.exports = ButtonStatus;

function invertArray(list) {
  var newList = [];
  for (let i = 0; i < list.length; i++) {
    newList[list[i]] = i;
  }
  return newList;
}
