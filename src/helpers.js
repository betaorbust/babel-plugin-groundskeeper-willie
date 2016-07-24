/**
 * @fileoverview This file contains helper methods for dealing with the AST,
 * finding pragmas, etc.
 */
'use strict';

 /**
  * Check if a comment is a line-disabling comment.
  * @param  {Object} comment       Comment AST object.
  * @param  {Regex} disabledRegex  The Regex to determine what is a disable-line-directive.
  * @return {Boolean}              If the comment is intended to disable its line.
  */
 const isLineDisableComment = function(comment, disabledRegex){
     return (comment.type === 'CommentLine' ||
             (comment.type === 'CommentBlock' && comment.loc.start.line === comment.loc.end.line)) &&
             comment.value.match(disabledRegex);
 };

/**
 * Fetch all lines that have Groundskeeper Willie disable-line directives.
 * @param  {Array} comments       The AST comment array for a file.
 * @param  {Regex} disabledRegex  The Regex to determine what is a disable-line-directive.
 * @return {Array}                Array of source lines that are disabled.
 */
const fetchDisabledLines = function(comments, disabledRegex){
    return comments
            .filter(comment => isLineDisableComment(comment, disabledRegex))
            .map(comment=>comment.loc.start.line);
};

 /**
  * Fetches all comment pragmas from a given set of file comments. This is the
  * primary way we decide what is in and what is outside of a groundskeeper pragma.
  * If a pragma is closed without being opened, or, at the end of the parsing run
  * has not been closed by a matching closing tag, this method will throw.
  * @param  {Array[Object]} comments  Array of comment AST objects.
  * @param  {Regex} pragmaRegex       The Regex to match a line disable directive.
  * @return {Array[Object]}           Array of pragma definitions.
  */
 const fetchPragmas = function(comments, pragmaRegex){
     let completePragmas = [];
     let openPragmas = [];
     comments.forEach(comment => {
         const pragmaPieces = pragmaRegex.exec(comment.value);

         if(pragmaPieces){ // If it's a pragma
             const [ , bookendToken, pragmaName] = pragmaPieces;
             if(bookendToken === ''){ // If it's an open:
                 // Push on to the open pragma's list with a name and a loc.
                 openPragmas.push({name: pragmaName, loc: {start: comment.loc.start}});
             }else { // If it's a close:
                 let found = false;
                 // Run from the back of the list with the name. When found remove from list and push to pragmaOutput
                 for(let i = openPragmas.length - 1; i >= 0; i--){
                     if(openPragmas[i].name === pragmaName){
                         found = true;
                         openPragmas[i].loc.end = comment.loc.end;
                         completePragmas.push(openPragmas[i]);
                         openPragmas.splice(i,1);
                         break;
                     }
                 }
                 if(!found){ // If you get to the end without closing the pragma, throw an error.
                     throw new Error(`Error in Groundskeeper Willie: </${pragmaName}> tried to close, but is not open.`);
                 }
             }
             comment.ignore = true; // Remove the pragma comment
         }
     });
     // If there are any left open, throw an error.
     if(openPragmas.length){
         throw new Error(`Error in Groundskeeper Willie: Pragma(s) left unclosed ${JSON.stringify(openPragmas, null, 4)}`);
     }
     return completePragmas.map(pragma => pragma.loc);
 };

 /**
  * Check if a node fall within any of the defined pragmas.
  * @param  {Object} node    The AST node being checked.
  * @param  {Array} pragmas  The array of active pragmas to check over.
  * @return {Boolean}        If the node falls within any of the pragmas.
  */
 const isInsidePragma = function(node, pragmas){
     for(let i = 0; i < pragmas.length; i++){
         const pragma = pragmas[i];
         const nodeLoc = node.loc;
         if(nodeLoc && nodeLoc.end && nodeLoc.start){
             const insideStart = nodeLoc.start.line > pragma.start.line ||
                     (nodeLoc.start.line === pragma.start.line && nodeLoc.start.column > pragma.start.column);


             const insideEnd = nodeLoc.end.line < pragma.end.line ||
                     (nodeLoc.end.line === pragma.end.line && nodeLoc.end.column < pragma.end.column);
             if(insideStart && insideEnd){
                 return true;
             }
         }
     }
     return false;
 };

 /**
  * Determine if a node starts on a line where Groundskeeper Willie should be
  * disabled.
  * @param  {Array} (disabledLines)  An array of disabled source lines
  * @param  {Object} (path)          The AST path object for the node to check.
  * @return {Boolean}                If the node provided falls within any of the
  *                                  disabled lines provided. Returns false if
  *                                  path or disabled lines are not given.
  */
 const isOnDisabledLine = function(disabledLines = [], path = {}){
     if(path.node && path.node.loc && path.node.loc.start){
             return disabledLines.indexOf(path.node.loc.start.line) !== -1;
     }
     return false;
 };


module.exports = {
    fetchDisabledLines,
    fetchPragmas,
    isInsidePragma,
    isLineDisableComment,
    isOnDisabledLine
};
