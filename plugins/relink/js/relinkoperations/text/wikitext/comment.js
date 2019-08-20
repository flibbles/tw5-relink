/*\

Handles comment blocks. Or rather //doesn't// handle them, since we should
ignore their contents.

"<!-- [[Renamed Title]] -->" will remain unchanged.

\*/

function ruleHandler(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.endMatchRegExp.lastIndex;
	return undefined;
};

// I don't use block parsing, but I want to cover both just in case.
exports['commentinline'] = exports['commentblock'] = ruleHandler;
