/**
 * @fileoverview This is the main functionality for the Groundskeeper willie
 * plugin.
 * @author Jacques Favreau (@betaorbust)
 */
'use strict';

const helpers = require('./helpers'); // All the plugin helper functions.

const DEFAULTS = {
    disableLineMatcher: /^\s*groundskeeper(-willie)?-disable-line\s*$/i, // Not currently possible  to set due to regex in JSON
    pragmaMatcher: /^\s?<(\/?)([\w\d\-]*)>\s*$/, // Not currently possible to set due to regex in JSON
    removeConsole: true,
    removeDebugger: true,
    removePragma: true
};

/**
 * The set of visitors this plugin will register.
 * @type {Object}   The visitor definition
 */
const removeGroundskeeperElements = {
    // Unfortunately, because there is currently no way to say "Remove everything
    // between these lines" we have to check each element's position relative to
    // the pragma comments.
    enter(path, state){
        if(state.removePragma && helpers.isInsidePragma(path.node, state.gkPragmas)){
            path.remove();
        }
    },
    // We're removing all console calls unless they're disabled via a line directive.
    CallExpression(path, state) {
        const isConsole = path.get("callee").matchesPattern("console", true);
        if(isConsole && state.removeConsole && !helpers.isOnDisabledLine(state.gkDisabledLines, path)){
            path.remove();
        }
    },
    // We're removing all debugger calls unless they're disabled via a line directive.
    DebuggerStatement(path, state) {
        if(state.removeDebugger && !helpers.isOnDisabledLine(state.gkDisabledLines, path)){
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
            Program(path, state) {
                // If no options are missing, use our defaults.
                state.opts = Object.assign({}, DEFAULTS, state.opts);
                const comments = path.parent && path.parent.comments ? path.parent.comments : [];
                const disabledLines = helpers.fetchDisabledLines(comments, state.opts.disableLineMatcher);
                const pragmaRegions = state.opts.removePragma ? helpers.fetchPragmas(comments, state.opts.pragmaMatcher) : [];
                path.traverse(removeGroundskeeperElements, Object.assign({
                        gkDisabledLines: disabledLines,
                        gkPragmas: pragmaRegions
                }, state.opts));
            }
        }
    };
};
