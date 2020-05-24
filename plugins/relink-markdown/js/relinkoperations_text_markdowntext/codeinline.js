/*\
module-type: wikirule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/codeinline.js
type: application/javascript

There shouldn't have to be a codeinline, but because markdown treats \n\s*\n
as a paragraph break, but Tiddlywiki only counts \n\n as a paragraph break,
I need this to deal with some stupid edge cases.
\*/

exports.name = "markdowncodeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	if (!this.parser.fromTitle || this.parser.type !== "text/x-markdown") {
		return undefined;
	}
	var text = this.parser.source;
	// We have to be stupid about this, because the Wikiparser likes to skip
	// whitespace.
	var line = text.lastIndexOf('\n', startPos);
	// Then we back up one more time to the previous line. This line must be
	// only whitespace.
	line = text.lastIndexOf('\n', startPos-1) + 1;
	var regExp = /^[^\S\n]+(?:\n(?:[ \t]{4}|\t)\S[^\n]*)+/mg;
	regExp.lastIndex = line;
	var match = regExp.exec(text);
	if (match) {
		var textStart = match.index;
		this.lastIndex = regExp.lastIndex;
		if (match.index < startPos) {
			return startPos;
		} else {
			return match.index;
		}
	}
	return undefined;
};

exports.relink = function() {
	this.parser.pos = this.lastIndex;
	return [];
};
