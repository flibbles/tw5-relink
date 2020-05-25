/*\
module-type: relinkmarkdownrule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/codeinline.js
type: application/javascript

Handles markdown `code` and ``code``.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");

exports.name = "codeinline";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	var matchRegExp = /`+/mg;
	matchRegExp.lastIndex = startPos;
	var match = matchRegExp.exec(this.parser.source);
	if (match) {
		var next = this.parser.source.indexOf(match[0], matchRegExp.lastIndex);
		if (next >= 0) {
			var end = next + match[0].length;
			if (this.parser.source.charAt(end) !== '`') {
				var nextGraph = utils.indexOfParagraph(this.parser.source, matchRegExp.lastIndex);
				if (nextGraph < 0 || nextGraph > next) {
					this.end = end;
					return match.index;
				}
			}
		}
	}
	return undefined;
};

exports.relink = function() {
	this.parser.pos = this.end;
	return undefined;
};
