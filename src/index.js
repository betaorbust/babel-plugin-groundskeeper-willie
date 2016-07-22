const DISABLE_LINE_REGEX = /^\s*groundskeeper(-willie)?-disable-line\s*$/i;
const PRAGMA_REGEX = /^\s?<(\/?)([^>*\/]*)>\s*$/;
/**
 * Check if a comment is a line-disabling comment.
 */
const isLineDisableComment = function(comment){
    return (comment.type === 'CommentLine' ||
            (comment.type === 'CommentBlock' && comment.loc.start.line === comment.loc.end.line)) &&
            comment.value.match(DISABLE_LINE_REGEX);
};

const fetchPragmas = function(comments){
    let pragmas = {};
    comments.forEach(comment => {
        const pragmaPieces = PRAGMA_REGEX.exec(comment.value);
        if(pragmaPieces){
            let pragmaName = pragmaPieces[2];
            let pragmaBookend = pragmaPieces[1] === '/' ? 'end' : 'start';
            pragmas[pragmaName] = pragmas[pragmaName] || {};
            pragmas[pragmaName][pragmaBookend] = comment.loc[pragmaBookend];
            comment.ignore = true;
        }
    });
    return pragmas;
};

const isInsidePragma = function(node, pragmas){
    for(let pragmaName in pragmas){ if(pragmas.hasOwnProperty(pragmaName)){
        const pragma = pragmas[pragmaName];
        const nodeLoc = node.loc;

        const insideStart = nodeLoc.start.line > pragma.start.line ||
                (nodeLoc.start.line === pragma.start.line && nodeLoc.start.column > pragma.start.column);
        const insideEnd = nodeLoc.end.line < pragma.end.line ||
                (nodeLoc.end.line === pragma.end.line && nodeLoc.end.column < pragma.end.column);
        if(insideStart && insideEnd){
            return true;
        }
    }}
    return false;
};


const remover = function(path){
    const isConsole = path.get("callee").matchesPattern("console", true);
    const isDisabledLine = this.groundskeeperDisabledLines.indexOf(path.node.loc.start.line) !== -1;
    if (isConsole && !isDisabledLine){
        path.remove();
    }
    if(isInsidePragma(path.node, this.groundskeeperPragmas)){
        path.remove();
    }
};

/**
 * A visitor to remove console.[log|warn|error|etc.]
 * @type {Object}   The visitor definition
 */
const removeGroundskeeperElements = {
    enter: remover
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
