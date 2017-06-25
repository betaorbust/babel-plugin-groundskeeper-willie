Groundskeeper Willie Babel Plugin
====================================
[![NPM Version](https://badge.fury.io/js/babel-plugin-groundskeeper-willie.svg)](https://badge.fury.io/js/babel-plugin-groundskeeper-willie)
[![Build Status](https://travis-ci.org/betaorbust/babel-plugin-groundskeeper-willie.svg?branch=master)](https://travis-ci.org/betaorbust/babel-plugin-groundskeeper-willie)
[![Dependency Status](https://david-dm.org/betaorbust/babel-plugin-groundskeeper-willie/status.svg)](https://david-dm.org/betaorbust/babel-plugin-groundskeeper-willie/status.svg)
[![Dev Dependency Status](https://david-dm.org/betaorbust/babel-plugin-groundskeeper-willie/dev-status.svg)](https://david-dm.org/betaorbust/babel-plugin-groundskeeper-willie/dev-status.svg)


This project is a Babel plugin encompassing and expanding the functionality of the very useful [Groundskeeper](https://github.com/Couto/groundskeeper) utility. Remaking Groundskeeper's
features as a Babel plugin gives ongoing support to ES2015+, while greatly reducing runtime
for those already using Babel in their build process.

This plugin will:
- **Remove `console` statements, so your production code doesn't junk up the console,
but your development code can be as verbose as you wish.**
  - To keep specific console statements, you can disable Groundskeeper Willie by adding
  a line disable directive, which makes it significantly more flexible compared to [babel-plugin-transform-remove-console](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-remove-console)

  Source:
  ```javascript
  console.log(`I'll be removed.`);
  console.log(`I'll be preserved!`); // groundskeeper-willie-disable-line
  ```
  Result:
  ```javascript
  console.log(`I'll be preserved!`); // groundskeeper-willie-disable-line
  ```
- **Remove `debugger` statements, so you don't accidentally ship halting code.**
  - Same as above, you can disable this in specific cases with a line disable directive.

  Source:
  ```javascript
  () => {
    debugger;
    do.something();
    debugger; // groundskeeper-willie-disable-line
  }
  ```
  Result:
  ```javascript
  () => {
    do.something();
    debugger; // groundskeeper-willie-disable-line
  }
  ```
- **Remove code between comment `<pragmas>`, so you can use your debug code in development, but strip it out in production.**

  Source:
  ```javascript
  module.exports = {
    prodFunction(){ /* ... */ },
    // <testCode>
    testFunction(){ /* ... */ },
    //</testCode>
    otherProdCode(){ /* ... */ }
  };
  ```
  Result:
  ```javascript
  module.exports = {
    prodFunction(){ /* ... */ },
    otherProdCode(){ /* ... */ }
  };
  ```

<p align="center">
  <img align="center" width="300px" src="https://cloud.githubusercontent.com/assets/921683/17076208/7eae721c-5061-11e6-8afd-3071b0de4f70.gif" />
</p>

Complete Example:
-----------------
####Input:
Here we have a file that has some development code, a console, etc.
```javascript
module.exports = {
    appCode(){
        console.log(`We're running with scissors!`);
        return [
            'included',
            /*<otherPragma>*/
            'excluded',
            /*</otherPragma>*/
            'also included'];
    }
};

//<debug>
module.exports.debugCode = {
    do.debugging.things.that.should.not.be.in.production();
}
//</debug>
```

#### Output:
When run with the Groundskeeper Willie plugin, we'll get back:
```javascript
module.exports = {
    appCode(){
        return [
            'included',
            'also included'];
    }
};
```
## Why would you do that?
Right now, we (at Netflix) use pragmas so that our developer logging, debug code, and
other related exports can live alongside the production code, but, at distribution time,
we can ship down the smallest payload, without junking up the console, or sending extra
unused code.

## What's a pragma?
For the purposes of our little plugin, pragmas are comments that have an opening
tag, and a closing tag, with a provided name. The pragma may appear in either a line
comment or a block comment, and look like HTML/XML-esq open and close tags.

```javascript
//<thisIsAPragma>
const removed = code.that.will.be.removed();
//</thisIsAPragma>
return ['included', /* <other> */ 'excluded', /* </other> */ 'also included'];
```

## Plugin Options
The following are the available options with their default values.
```json
{
    "plugins": [
        [
            "groundskeeper-willie",
            {
                "removeConsole":  true,
                "removeDebugger": true,
                "removePragma":   true,
                "pragmaMatcher":  "^\\s?<(\/?)([\\w\\d\\-]*)>\\s*$"
            }
        ]
    ]
}
```
#### `removeConsole`
If you wish to leave in all console statements, set this to false.
#### `removeDebugger`
If you wish to leave in all debugger statements, set this to false.
#### `removePragma`
If you wish to leave in all pragmas-wrapped code, stet this to false.
#### `pragmaMatcher`
May be a regexp string or string array.
If it is a regexp string, it should have two capture groups: first determines closing pragma, second — pragma name.
If it is a string array, it should contain names of pragmas, which will be removed.

Remove only `debug` and `lol` pragmas:

````json
{
    "pragmaMatcher": "^\\s?<(\\/?)(debug|lol)>\\s*$"
}
````

Exactly the same as before, but as array:

````json
{
    "pragmaMatcher": ["debug", "lol"]
}
````
