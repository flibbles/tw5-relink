/*\
module-type: relinkmarkdownrule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/indent.js
type: application/javascript

Handles markdown indent code blocks.

    text with 4 spaces before itgets put in a block

We handle this so we know when ''not'' to parse markdown links.
\*/

exports.name = "indent";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /^([ \t]{4,}|\s*\t\s*)\S[^\n]*(?:\n(?:[ \t]{4,}|\s*\t\s*)\S[^\n]*)*/mg;
};

exports.relink = function() {
	this.parser.pos = this.matchRegExp.lastIndex;
	return undefined;
};
