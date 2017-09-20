'use strict';
const USABLE_BIT_COUNT = 7;

// Bitfield with least significant bit of each byte reserved
class Bitfield {
  static fromBits(bitArray) {
    let newBuf = new Buffer(byteIndex(bitArray.length - 1) + 1);
    for (let bufIdx = 0; bufIdx < bitArray.length; bufIdx++) {
      let byteNum = byteIndex(bufIdx);
      let mask = bitMask(bufIdx);
      newBuf[byteNum] = bitArray[bufIdx] ? newBuf[byteNum] | mask : newBuf[byteNum];
    }
    return new Bitfield(newBuf);
  }

  constructor(buffer) {
    if (buffer instanceof Buffer) {
      this.buffer = new Buffer(buffer.length);
      buffer.copy(this.buffer);
    } else if (isNumeric(buffer)) {
      this.buffer = new Buffer(byteIndex(Math.floor(Number(buffer) - 1)) + 1);
    } else {
      throw new Error('Bitfield constructor accepts a Buffer or an integer bitfield width');
    }
  }

  get length() {
    return this.buffer.length * USABLE_BIT_COUNT;
  }

  // Only copies buffers and other bitfields.
  copyFrom(other) {
    if (other instanceof Buffer) {
      other.copy(this.buffer);
    } else {
      other.buffer.copy(this.buffer);
    }
  }

  copyTo(other) {
    if (other instanceof Buffer) {
      this.buffer.copy(other);
    } else {
      this.buffer.copy(other.buffer);
    }
  }

  at(index) {
    let byte = this.buffer[byteIndex(index)];
    let mask = bitMask(index);
    let bit = (byte & mask) > 0;
    return bit ? 1 : 0;
  }

  // Returns a new buffer with the desired bit set
  setAt(index, value = 1) {
    let newBuf = new Buffer(this.buffer.length);
    let byteIdx = byteIndex(index);
    let mask = bitMask(index);
    this.buffer.copy(newBuf);
    if (value) {
      newBuf[byteIdx] = newBuf[byteIdx] | mask;
    } else {
      newBuf[byteIdx] = newBuf[byteIdx] & ~mask;
    }
    return new Bitfield(newBuf);
  }

  toArray() {
    return [...this];
    // Like... duh.
  }

  toString() {
    return this.toArray().join('');
  }

  *xor(otherBitfield) {
    for (let i = 0; i < this.length; i++) {
      if (this.at(i) !== otherBitfield.at(i)) {
        yield { index: i, value: this.at(i) };
      }
    }
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < USABLE_BIT_COUNT * this.buffer.length; i++) {
      yield this.at(i);
    }
  }

}
module.exports = Bitfield;

function byteIndex(index) {
  return Math.floor(index / USABLE_BIT_COUNT);
}

function bitMask(index) {
  return 1 << bitIndex(index);
}

function bitIndex(index) {
  return index % USABLE_BIT_COUNT + (8 - USABLE_BIT_COUNT);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
