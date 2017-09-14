const EventEmitter = require('events').EventEmitter;

class ButtonStatus extends EventEmitter {
  constructor(mappings) {
    super();
    this.mappings = mappings;
    this.buttons = {};
    this.states = mappings.map(() => new Buffer(8));
    this.oldStates = mappings.map(() => new Buffer(8));
    this.dataQueues = mappings.map(() => new Buffer());
  }

  update(mappingIdx, data) {
    // Update queue with incoming data.
    this.dataQueues[mappingIdx] = Buffer.concat([this.dataQueues[mappingIdx], data]);

    const states = this.states[mappingIdx];
    const oldStates = this.oldStates[mappingIdx];
    const dataQueue = this.dataQueues[mappingIdx];

    // Sentinel byte has a 1 in its LSB. Says sequence is complete.
    console.log('checking dataQueue filter')
    let seqCount = dataQueue.filter(byte => byte & 1).length;
    console.log('checked dataQueue filter')
    if (seqCount === 0) return;

    // Move current states to old states.
    states.copy(oldStates);

    // Process each buffered sequence.
    for (let seqNum = 0; seqNum < seqCount; seqNum++) {
      dataQueue.copy(states);
      this._triggerEvents(mappingIdx)
    }
  }

  isPressed(i) {
    return this._decodeState(this.states, i);
  }

  toJSON() {
    let combinedStates = {};
    this.states.forEach((deviceState, deviceIdx) => {
      deviceState.forEach(button => {
        let mappedButtonIdx = this.mappings[deviceIdx][button];
        combinedStates[mappedButtonIdx] = this.isPressed(mappedButtonIdx);
      });
    });
    return JSON.stringify(combinedStates  , null, ' ');
  }

  _triggerEvents(mappingIdx) {
    const states = this.states[mappingIdx];
    const oldStates = this.oldStates[mappingIdx];
    const mapping = this.mappings[mappingIdx];
console.log('triggering');
    for (let i = 0; i < states.length; i++) {
      if (states[i] !== oldStates[i]) {
        this.emit(states[i] ? 'buttonDown' : 'buttonUp', mapping[i]);
      }
    }
  }

  _decodeState(allStates, i) {
    return (states[i / 7] & (1 << (i % 7 + 1))) > 0;
  }
}

module.exports = ButtonStatus;
