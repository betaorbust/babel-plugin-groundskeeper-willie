const path = require('path');
const fs = require('fs');
const { transformFileSync } = require('babel-core');

function trim(str) {
	return str.replace(/^\s+|\s+$/, '');
}

describe('The plugin', () => {
	const fixturesDir = path.join(__dirname, 'fixtures');
	for (const caseName of fs.readdirSync(fixturesDir)) {
		it(`should ${caseName.split('-').join(' ')}`, () => {
			const fixtureDir = path.join(fixturesDir, caseName);
			const actualPath = path.join(fixtureDir, 'actual.js');
			const actual = transformFileSync(actualPath).code;

			const expected = fs
				.readFileSync(path.join(fixtureDir, 'expected.js'))
				.toString();
			expect(trim(actual)).toEqual(trim(expected));
		});
	}
});
