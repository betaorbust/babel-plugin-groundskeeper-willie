/* eslint-disable no-console, no-unused-expressions, no-undef, no-debugger, spaced-comment*/

console.log(`I'll be removed.`);
console.log(`I'll be preserved!`); // groundskeeper-willie-disable-line

() => {
	debugger;
	here.we.do.something();
	debugger; // groundskeeper-willie-disable-line
};

module.exports = {
	prodFunction() {
		/* ... */
	},
	// <testCode>
	testFunction() {
		/* ... */
	},
	//</testCode>
	otherProdCode() {
		/* ... */
	},
};

module.exports = {
	appCode() {
		console.log(`We're running with scissors!`);
		return [
			'included',
			/*<otherPragma>*/
			'excluded',
			/*</otherPragma>*/
			'also included',
		];
	},
};

//<debug>
module.exports.debugCode = {
	do: things.that.should.not.be.in.production(),
};
//</debug>
