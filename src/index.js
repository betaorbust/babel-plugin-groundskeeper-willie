/**
 * @fileoverview This is the main functionality for the Groundskeeper willie
 * plugin.
 * @author Jacques Favreau (@betaorbust)
 */
'use strict';

const helpers = require('./helpers'); // All the plugin helper functions.

// Define how we detect line disable directives.
const DISABLE_LINE_REGEX = /^\s*groundskeeper(-willie)?-disable-line\s*$/i;

// Define how we detect pragmas.
const PRAGMA_REGEX = /^\s?<(\/?)([\w\d\-]*)>\s*$/;

/**
 * The set of visitors this plugin will register.
 * @type {Object}   The visitor definition
 */
const removeGroundskeeperElements = {
    // Unfortunately, because there is currently no way to say "Remove everything
    // between these lines" we have to check each element's position relative to
    // the pragma comments.
    enter(path){
        if(helpers.isInsidePragma(path.node, this.gkPragmas)){
            path.remove();
        }
    },
    // We're removing all console calls unless they're disabled via a line directive.
    CallExpression(path) {
        const isConsole = path.get("callee").matchesPattern("console", true);
        if(isConsole && !helpers.isOnDisabledLine(this.gkDisabledLines, path)){
            path.remove();
        }
    },
    // We're removing all debugger calls unless they're disabled via a line directive.
    DebuggerStatement(path) {
        if(!helpers.isOnDisabledLine(this.gkDisabledLines, path)){
            path.remove();
        }
      }
};

/**
 * The actual export for the plugin.
 * Because comments are not first-class citizens of the AST, we need to do all
 * comment calculations up front.
 * @param  {Object} babel The babel singleton.
 * @return {Object}       The plugin visitors.
 */
module.exports = function(babel) {
    return {
        visitor: {
            Program(path) {
                const disabledLines = helpers.fetchDisabledLines(path.parent.comments, DISABLE_LINE_REGEX);
                const pragmaRegions = helpers.fetchPragmas(path.parent.comments, PRAGMA_REGEX);
                path.traverse(removeGroundskeeperElements, {
                    gkDisabledLines: disabledLines,
                    gkPragmas: pragmaRegions
                });
            }
        }
    };
};
