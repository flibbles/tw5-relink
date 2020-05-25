/*\
module-type: relinkmarkdownrule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/footnote.js
type: application/javascript

Handles markdown footnotes

[1]: #link

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");

function FootnoteEntry() {};
FootnoteEntry.prototype.name = "markdownfootnote";
FootnoteEntry.prototype.report = function() {
	return ["DUD"];
};

exports.name = "markdownfootnote";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /(\[[^\^\s\]][^\s\]]*\]:[^\S\n]*)(#?)(\S+)([^\S\n]*(?:\n|$))/mg;
};

exports.findNextMatch = function(startPos) {
	this.match = this.matchFootnote(this.parser.source, startPos);
	return this.match ? this.match.index : undefined;
};

exports.survey = function(text) {
	return this.matchFootnote(text, 0);
};

exports.matchFootnote = function(text, pos) {
	var matchRegExp = /(\[[^\^\s\]][^\s\]]*\]:[^\S\n]*)(#?)(\S+)([^\S\n]*(?:\n|$))/mg;
	matchRegExp.lastIndex = pos;
	return matchRegExp.exec(text);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		link = m[3],
		entry;
	this.parser.pos = m.index + m[0].length;
	if (m[2] === "#" && decodeURIComponent(link) === fromTitle) {
		entry = new FootnoteEntry();
		entry.output = m[1] + m[2] + utils.encodeLink(toTitle) + m[4];
	}
	return entry;
};
