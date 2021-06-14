/**
 * @fileoverview This is the main functionality for the Groundskeeper willie
 * plugin.
 * @author Jacques Favreau (@betaorbust)
 */
import { Visitor, NodePath } from '@babel/traverse';
import * as BabelTypes from '@babel/types';
import * as helpers from './helpers';

const DEFAULTS = {
	disableLineMatcher: /^\s*groundskeeper(-willie)?-disable-line\s*$/i, // Not currently possible  to set due to regex in JSON
	pragmaMatcher: /^\s?<(\/?)([\w-]*)>\s*$/, // Not currently possible to set due to regex in JSON
	removeConsole: true,
	removeDebugger: true,
	removePragma: true,
};

interface Babel {
	types: typeof BabelTypes;
}

export interface PluginOptions {
	opts: {
		gkDisabledLines: Array<number>;
		gkPragmas: Array<helpers.PragmaSet>;
	} & typeof DEFAULTS;
	file: {
		path: NodePath;
	};
}

/**
 * The actual export for the plugin.
 * Because comments are not first-class citizens of the AST, we need to do all
 * comment calculations up front.
 * @return {Object}       The plugin visitors.
 */

export function plugin(babel: Babel): { visitor: Visitor<PluginOptions> } {
	/**
	 * The set of visitors this plugin will register.
	 * @type {Object}   The visitor definition
	 */
	const removeGroundskeeperElements: Visitor<PluginOptions['opts']> = {
		// Unfortunately, because there is currently no way to say "Remove everything
		// between these lines" we have to check each element's position relative to
		// the pragma comments.
		enter(path, state) {
			if (
				state &&
				state.removePragma &&
				helpers.isInsidePragma(path.node.loc, state.gkPragmas)
			) {
				babel.types.removeComments(path.node);
				path.remove();
			}
		},
		// We're removing all console calls unless they're disabled via a line directive.
		CallExpression(path, state) {
			const isConsole = path.get('callee').matchesPattern('console', true);
			if (
				isConsole &&
				state &&
				state.removeConsole &&
				!helpers.isOnDisabledLine(state.gkDisabledLines, path)
			) {
				path.remove();
			}
		},
		// We're removing all debugger calls unless they're disabled via a line directive.
		DebuggerStatement(path, state) {
			if (
				state &&
				state.removeDebugger &&
				!helpers.isOnDisabledLine(state.gkDisabledLines, path)
			) {
				path.remove();
			}
		},
	};

	return {
		visitor: {
			Program(path, state): void {
				// If no options are missing, use our defaults.
				// eslint-disable-next-line no-param-reassign
				state.opts = { ...DEFAULTS, ...state.opts };

				const comments: Array<BabelTypes.Comment> =
					// @ts-expect-error the File type doesn't have comments listed yet.
					path?.parent?.comments ?? [];

				const disabledLines = helpers.fetchDisabledLines(
					comments,
					state.opts.disableLineMatcher
				);

				const pragmaRegions = state.opts.removePragma
					? helpers.fetchPragmas(comments, state.opts.pragmaMatcher)
					: [];
				path.traverse(removeGroundskeeperElements, {
					...state.opts,
					gkDisabledLines: disabledLines,
					gkPragmas: pragmaRegions,
				});

				// throw new Error(JSON.stringify(Object.keys(path)));
				// // @ts-expect-error still no comment type
				// path.comments = comments.filter(
				// 	(comment) => !helpers.isInsidePragma(comment.loc, pragmaRegions)
				// );
			},
		},
	};
}
