'use strict';
const DISABLE_LINE_REGEX = /^\s*groundskeeper(-willie)?-disable-line\s*$/i;
const PRAGMA_REGEX = /^\s?<(\/?)([\w\d\-]*)>\s*$/;
/**
 * Check if a comment is a line-disabling comment.
 */
const isLineDisableComment = function(comment){
    return (comment.type === 'CommentLine' ||
            (comment.type === 'CommentBlock' && comment.loc.start.line === comment.loc.end.line)) &&
            comment.value.match(DISABLE_LINE_REGEX);
};

const fetchPragmas = function(comments){
    let completePragmas = [];
    let openPragmas = [];
    comments.forEach(comment => {
        const pragmaPieces = PRAGMA_REGEX.exec(comment.value);

        if(pragmaPieces){ // If it's a pragma
            let pragmaName = pragmaPieces[2];
            if(pragmaPieces[1] === ''){ // If it's an open:
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

const remover = function(path){
    if(isInsidePragma(path.node, this.groundskeeperPragmas)){
        path.remove();
    }
};

/**
 * A visitor to remove console.[log|warn|error|etc.]
 * @type {Object}   The visitor definition
 */
const removeGroundskeeperElements = {
    enter: remover,
    CallExpression(path) {
        const isConsole = path.get("callee").matchesPattern("console", true);
        const isDisabledLine = this.groundskeeperDisabledLines.indexOf(path.node.loc.start.line) !== -1;
        if(isConsole && !isDisabledLine){
            path.remove();
        }
    }
};

module.exports = function(babel) {
    return {
        visitor: {
            Program(path) {
                const disabledLines = path.parent.comments
                                        .filter(isLineDisableComment)
                                        .map(comment=>comment.loc.start.line);
                const pragmaRegions = fetchPragmas(path.parent.comments);
                path.traverse(removeGroundskeeperElements, {
                    groundskeeperDisabledLines: disabledLines,
                    groundskeeperPragmas: pragmaRegions
                });
            }
        }
    };
};
