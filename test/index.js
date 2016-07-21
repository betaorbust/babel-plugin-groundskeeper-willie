const path = require('path');
const fs = require('fs');
const assert = require('assert');
const transformFileSync = require('babel-core').transformFileSync;
const plugin = require('../src');

function trim(str) {
  return str.replace(/^\s+|\s+$/, '');
}

describe('The spiritual successor to groundskeeper. Removes console, debug, and pragma-wrapped code.', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  fs.readdirSync(fixturesDir).map((caseName) => {
    it(`should ${caseName.split('-').join(' ')}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actualPath = path.join(fixtureDir, 'actual.js');
      const actual = transformFileSync(actualPath).code;

      const expected = fs.readFileSync(
          path.join(fixtureDir, 'expected.js')
      ).toString();
    //   console.log(actual);
    //   console.log(expected);
      assert.equal(trim(actual), trim(expected));
    });
  });
});
