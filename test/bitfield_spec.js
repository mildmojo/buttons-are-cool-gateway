'use strict';
/* global describe it */
const assert = require('assert');
const Bitfield = require('../lib/bitfield');
const USABLE_BITS_COUNT = 7;

describe('Bitfield', () => {
  let bitfield = null;

  it('should construct from a buffer', () => {
    bitfield = new Bitfield(Buffer.from([0x02]));
    assert.equal(bitfield.length, USABLE_BITS_COUNT);
  });

  it('should construct from a bit width', () => {
    bitfield = new Bitfield(USABLE_BITS_COUNT);
    assert.equal(bitfield.length, USABLE_BITS_COUNT);
  });

  it('should construct using bit width in multiples of usable bits', () => {
    bitfield = new Bitfield(USABLE_BITS_COUNT + 1);
    assert.equal(bitfield.length, 2*USABLE_BITS_COUNT);
  });

  it('should construct from a bit array', () => {
    bitfield = Bitfield.fromBits([1,0,1]);
    assert.equal(bitfield.length, USABLE_BITS_COUNT);
  });

  it('should construct equal bitfields via all methods', () => {
    let b1 = Bitfield.fromBits([1,0,1]);
    let b2 = new Bitfield(Buffer.from([0x0a]));
    assert.deepEqual(b1.buffer, b2.buffer);
  });

  it('should be iterable', () => {
    bitfield = Bitfield.fromBits([1,0,1]);
    assert.doesNotThrow(() => {
      for (let bit of bitfield) { bit }
    });
  });

  describe('length', () => {
    it('should report its length', () => {
      bitfield = new Bitfield(USABLE_BITS_COUNT);
      assert.equal(bitfield.length, USABLE_BITS_COUNT);
    });
  });

  describe('toArray()', () => {
    it('should convert to an array', () => {
      bitfield = Bitfield.fromBits([1,0,1]);
      assert.deepEqual(bitfield.toArray(), [1,0,1,0,0,0,0]);
    });
  });

  describe('toString()', () => {
    it('should convert to a string', () => {
      bitfield = Bitfield.fromBits([1,0,1]);
      assert.equal(bitfield.toString(), '1010000');
    });
  });


  describe('copyFrom()', () => {
    it('should copy from a buffer', () => {
      let bufSrc = Buffer.from([0x0a]);
      let bfDest = new Bitfield(USABLE_BITS_COUNT);
      assert.notDeepEqual(bfDest.buffer, bufSrc);

      bfDest.copyFrom(bufSrc);
      assert.deepEqual(bfDest.buffer, bufSrc);

      bufSrc[0] = 0xFF;
      assert.notDeepEqual(bfDest.buffer, bufSrc);
    });

    it('should copy from another bitfield', () => {
      let bfSrc = Bitfield.fromBits([1,0,1]);
      let bfDest = new Bitfield(USABLE_BITS_COUNT);
      assert.notDeepEqual(bfDest.buffer, bfSrc.buffer);

      bfDest.copyFrom(bfSrc);
      assert.deepEqual(bfDest.buffer, bfSrc.buffer);

      bfSrc = bfSrc.setAt(0, 0);
      assert.notDeepEqual(bfDest.buffer, bfSrc.buffer);
    });
  });

  describe('copyTo()', () => {
    it('should copy to a buffer', () => {
      let bfSrc = Bitfield.fromBits([1,0,1]);
      let bufDest = Buffer(1);
      assert.notDeepEqual(bufDest, bfSrc.buffer);

      bfSrc.copyTo(bufDest);
      assert.deepEqual(bufDest, bfSrc.buffer);

      bfSrc = bfSrc.setAt(0, 0);
      assert.notDeepEqual(bufDest, bfSrc.buffer);
    });

    it('should copy to another bitfield', () => {
      let bfSrc = Bitfield.fromBits([1,0,1]);
      let bfDest = new Bitfield(USABLE_BITS_COUNT);
      assert.notDeepEqual(bfDest.buffer, bfSrc.buffer);

      bfSrc.copyTo(bfDest);
      assert.deepEqual(bfDest.buffer, bfSrc.buffer);

      bfSrc = bfSrc.setAt(0, 0);
      assert.notDeepEqual(bfDest.buffer, bfSrc.buffer);
    });
  });

  describe('at()', () => {
    it('should return a bit at an index', () => {
      bitfield = Bitfield.fromBits([1,0,1]);
      assert.equal(bitfield.at(0), 1);
      assert.equal(bitfield.at(1), 0);
      assert.equal(bitfield.at(2), 1);
    });
  });

  describe('setAt()', () => {
    it('should set bits at specified indexes and return a new bitfield', () => {
      let bf1 = Bitfield.fromBits([1,1,0]);

      let bf2 = bf1.setAt(0,0);
      assert.notStrictEqual(bf2, bf1);
      assert.equal(bf1.at(0), 1);
      assert.equal(bf1.at(1), 1);
      assert.equal(bf1.at(2), 0);
      assert.equal(bf2.at(0), 0);
      assert.equal(bf2.at(1), 1);
      assert.equal(bf2.at(2), 0);

      bf2 = bf1.setAt(2,1);
      assert.notStrictEqual(bf2, bf1);
      assert.equal(bf1.at(0), 1);
      assert.equal(bf1.at(1), 1);
      assert.equal(bf1.at(2), 0);
      assert.equal(bf2.at(0), 1);
      assert.equal(bf2.at(1), 1);
      assert.equal(bf2.at(2), 1);
    });
  });

  describe('xor()', () => {
    it('should produce an iterable', () => {
      let bf1 = Bitfield.fromBits([1,0,1]);
      let bf2 = Bitfield.fromBits([1,1,0]);
      assert.doesNotThrow(() => {
        for (let delta of bf1.xor(bf2)) { delta }
      });
    });

    it('should produce an iterable list of differences between two bitfields', () => {
      let bf1 = Bitfield.fromBits([1,0,1]);
      let bf2 = Bitfield.fromBits([1,1,0]);
      let changeIdx = 1;
      for (let {index, value} of bf1.xor(bf2)) {
        assert.equal(index, changeIdx++)
        assert.equal(value, bf1.at(index));
      }
    });
  });
});
