const DISABLE_LINE_REGEX = /^\s*groundskeeper(-willie)?-disable-line\s*$/i;

/**
 * Check if a comment is a line-disabling comment.
 * @param  {[type]} comment [description]
 * @return {[type]}         [description]
 */
const isLineDisableComment = function(comment){
    return (comment.type === 'CommentLine' ||
            (comment.type === 'CommentBlock' && comment.loc.start.line === comment.loc.end.line)) &&
            comment.value.match(DISABLE_LINE_REGEX);
};

/**
 * A visitor to remove console.[log|warn|error|etc.]
 * @type {Object}   The visitor definition
 */
const removeConsoleCallsVisitor = {
    CallExpression(path) {
        const isConsole = path.get("callee").matchesPattern("console", true);
        const isDisabledLine = this.groundskeeperDisabledLines.indexOf(path.node.loc.start.line) !== -1;
        if (isConsole && !isDisabledLine){
            path.remove();
        }
    }
};

module.exports = function() {
    return {
        visitor: {
            Program(path) {
                const disabledLines = path.parent.comments
                                        .filter(isLineDisableComment)
                                        .map(comment=>comment.loc.start.line);
                path.traverse(removeConsoleCallsVisitor, {groundskeeperDisabledLines: disabledLines});
            }
        }
    };
};
