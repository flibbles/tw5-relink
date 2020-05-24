/*\
module-type: wikirule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/codeblock.js
type: application/javascript

Handles markdown code blocks.

    text with 4 spaces before itgets put in a block

We handle this so we know when ''not'' to parse markdown links.
\*/

//TODO: Make sure It blocks wikirules too
exports.name = "markdowncodeblock";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	if (!this.parser.fromTitle || this.parser.type !== "text/x-markdown") {
		return undefined;
	}
	// We have to be stupid about this, because the Wikiparser likes to skip
	// whitespace.
	var line = this.parser.source.lastIndexOf('\n', startPos) + 1;
	var regExp = /^([ \t]{4,}|\s*\t\s*)\S[^\n]*(?:\n(?:[ \t]{4,}|\s*\t\s*)\S[^\n]*)*/mg;
	regExp.lastIndex = line;
	var match = regExp.exec(this.parser.source);
	if (match) {
		var textStart = match.index + match[1].length;
		if (textStart >= startPos) {
			this.lastIndex = regExp.lastIndex;
			return textStart;
		}
	}
	return undefined;
};

exports.relink = function() {
	this.parser.pos = this.lastIndex;
	return [];
};
