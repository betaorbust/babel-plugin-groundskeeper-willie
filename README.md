Groundskeeper Willie Babel Plugin
====================================
[![Build Status](https://travis-ci.org/betaorbust/babel-plugin-groundskeeper-willie.svg?branch=master)](https://travis-ci.org/betaorbust/babel-plugin-groundskeeper-willie) [![Build Status](https://david-dm.org/betaorbust/babel-plugin-groundskeeper-willie.svg)](https://david-dm.org/betaorbust/babel-plugin-groundskeeper-willie.svg)

This projects is is a babel (and therefor ES215+ compatible) rewrite of the very
useful [Groundskeeper](https://github.com/Couto/groundskeeper) utility, and as
we're taking inspiration from the idea, let's take inspiration from the
description as well!
>This is a small utility to remove forgotten console and specific blocks of code from Javascript files.

This plugin will:
- **Remove `console` statements (log, warn, etc.) so your production code doesn't junk up the
console, but your development code can be as verbose as you wish**
  - You can disable (to keep the console statement) Groundskeeper Willie by adding a line disable directive, which
  makes it significantly more flexible compared to [babel-plugin-transform-remove-console](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-remove-console)
  ```javascript
  console.log(`I'll be preserved!`); // groundskeeper-willie-disable-line
  ```
- **Remove code between comment `<pragmas>` so you can use your debug code in development, and strip it out in production**
  - See bottom of this file for a longer discussion on what a pragma looks like.

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
comment or a block comment.

```javascript
//<thisIsAPragma>
const removed = code.that.will.be.removed();
//</thisIsAPragma>
return ['included', /* <other> */ 'excluded', /* </other> */ 'also included'];
```
