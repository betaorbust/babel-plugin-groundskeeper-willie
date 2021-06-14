import { NodePath } from '@babel/traverse';
import * as BabelTypes from '@babel/types';
/**
 * @fileoverview This file contains helper methods for dealing with the AST,
 * finding pragmas, etc.
 */

export type PragmaSet = {
	name: string;
	loc: BabelTypes.Comment['loc'];
	parts: {
		start: BabelTypes.Comment;
		end: BabelTypes.Comment;
	};
};

export type Pragma = {
	name: string;
	node: BabelTypes.Comment;
};

/**
 * Check if a comment is a line-disabling comment.
 * @param  {Object} comment       Comment AST object.
 * @param  {Regex} disabledRegex  The Regex to determine what is a disable-line-directive.
 * @return {Boolean}              If the comment is intended to disable its line.
 */
export const isLineDisableComment = (
	comment: BabelTypes.Comment,
	disabledRegex: RegExp
): boolean => {
	const isDisableComment =
		comment.type === 'CommentLine' ||
		(comment.type === 'CommentBlock' &&
			comment.loc.start.line === comment.loc.end.line);
	const matches = comment.value.match(disabledRegex) !== null;
	return isDisableComment && matches;
};

/**
 * Fetch all lines that have Groundskeeper Willie disable-line directives.
 * @param  {Array} comments       The AST comment array for a file.
 * @param  {Regex} disabledRegex  The Regex to determine what is a disable-line-directive.
 * @return {Array}                Array of source lines that are disabled.
 */
export function fetchDisabledLines(
	comments: Array<BabelTypes.Comment>,
	disabledRegex: RegExp
): Array<number> {
	return comments
		.filter((comment) => isLineDisableComment(comment, disabledRegex))
		.map((comment) => comment.loc.start.line);
}

/**
 * Fetches all comment pragmas from a given set of file comments. This is the
 * primary way we decide what is in and what is outside of a groundskeeper pragma.
 * If a pragma is closed without being opened, or, at the end of the parsing run
 * has not been closed by a matching closing tag, this method will throw.
 * @param  {Array[Object]} comments  Array of comment AST objects.
 * @param  {Regex} pragmaRegex       The Regex to match a line disable directive.
 * @return {Array[Object]}           Array of pragma definitions.
 */
export function fetchPragmas(
	comments: Array<BabelTypes.Comment>,
	pragmaRegex: RegExp
): Array<PragmaSet> {
	const completePragmas: Array<PragmaSet> = [];
	const openPragmas: Array<Pragma> = [];
	for (const comment of comments) {
		const pragmaPieces = pragmaRegex.exec(comment.value);

		if (pragmaPieces) {
			// If it's a pragma
			const [, bookendToken, pragmaName] = pragmaPieces;
			if (bookendToken === '') {
				// If it's an open:
				// Push on to the open pragma's list with a name and a loc.
				openPragmas.push({
					name: pragmaName,
					node: comment,
				});
			} else {
				// If it's a close:
				let found = false;
				// Run from the back of the list with the name. When found remove from list and push to pragmaOutput
				for (let i = openPragmas.length - 1; i >= 0; i -= 1) {
					if (openPragmas[i].name === pragmaName) {
						found = true;
						const openPragma = openPragmas[i];
						completePragmas.push({
							name: pragmaName,
							loc: {
								start: openPragma.node.loc.start,
								end: comment.loc.end,
							},
							parts: { start: openPragma.node, end: comment },
						});
						openPragmas.splice(i, 1);
						break;
					}
				}
				if (!found) {
					// If you get to the end without closing the pragma, throw an error.
					throw new Error(
						`Error in Groundskeeper Willie: </${pragmaName}> tried to close, but is not open.`
					);
				}
			}
			// comment.ignore = true; // Remove the pragma comment
		}
	}
	// If there are any left open, throw an error.
	if (openPragmas.length > 0) {
		throw new Error(
			`Error in Groundskeeper Willie: Pragma(s) left unclosed ${JSON.stringify(
				openPragmas,
				undefined,
				4
			)}`
		);
	}
	return completePragmas;
}

/**
 * Check if a node fall within any of the defined pragmas.
 * @param  {Object} nodeLoc    The AST node being checked.
 * @param  {Array} pragmas  The array of active pragmas to check over.
 * @return {Boolean}        If the node falls within any of the pragmas.
 */
export function isInsidePragma(
	nodeLoc: BabelTypes.Node['loc'],
	pragmas: Array<PragmaSet>
): boolean {
	for (const pragma of pragmas) {
		if (nodeLoc?.end && nodeLoc?.start) {
			const insideStart =
				nodeLoc.start.line > pragma.loc.start.line ||
				(nodeLoc.start.line === pragma.loc.start.line &&
					nodeLoc.start.column > pragma.loc.start.column);

			const insideEnd =
				nodeLoc.end.line < pragma.loc.end.line ||
				(nodeLoc.end.line === pragma.loc.end.line &&
					nodeLoc.end.column < pragma.loc.end.column);
			if (insideStart && insideEnd) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Determine if a node starts on a line where Groundskeeper Willie should be
 * disabled.
 * @param  {Array} (disabledLines)  An array of disabled source lines
 * @param  {Object} (path)          The AST path object for the node to check.
 * @return {Boolean}                If the node provided falls within any of the
 *                                  disabled lines provided. Returns false if
 *                                  path or disabled lines are not given.
 */
export function isOnDisabledLine(
	disabledLines: Array<number> = [],
	path: NodePath
): boolean {
	if (path?.node?.loc?.start) {
		return disabledLines.includes(path.node.loc.start.line);
	}
	return false;
}
