'use strict';
/* global describe beforeEach it */
const assert = require('assert');
const ButtonStatus = require('../lib/buttonStatus');

describe('buttonStatus', () => {
  let buttonStatus = null;

  beforeEach(() => {
    buttonStatus = new ButtonStatus([0,1,2]);
  });

  describe('update()', () => {
    it('should decode an update', () => {
      buttonStatus.update(Buffer.from([0x03]));
      assert.ok(buttonStatus.isPressed(0));
    });

    it('should fire buttonDown event', done => {
      let buttonsDown = [];

      buttonStatus.on('buttonDown', button => {
        buttonsDown.push(button);
        if (buttonsDown.length === 2) {
          assert.deepEqual(buttonsDown, [0,1]);
          done();
        }
      });

      buttonStatus.update(Buffer.from([0x07]));
    });

    it('should fire buttonUp event', done => {
      let buttonsUp = [];

      buttonStatus.on('buttonUp', button => {
        buttonsUp.push(button);
        if (buttonsUp.length === 2) {
          assert.deepEqual(buttonsUp, [0,1]);
          done();
        }
      });

      buttonStatus.update(Buffer.from([0x07]));
      buttonStatus.update(Buffer.from([0x01]));
    });
  });

  describe('toJSON()', () => {
    it('should emit a plain old object with length and button states', () => {
      let json = buttonStatus.toJSON();
      assert.ok('length' in json);
      assert.ok('buttons' in json);
      assert.equal(json.length, 3);
      assert.deepEqual(json.buttons, {0:0, 1:0, 2:0});
    });
  });
})
