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
	this.matchRegExp = /``?/mg;
};

exports.relink = function() {
	this.parser.pos = this.matchRegExp.lastIndex;
	var reEnd = new RegExp(this.match[0], "mg");
	reEnd.lastIndex = this.parser.pos;
	var match = reEnd.exec(this.parser.source);
	if (match) {
		var nextGraph = utils.indexOfParagraph(this.parser.source, this.matchRegExp.lastIndex);
		if (nextGraph < 0 || nextGraph > match.index) {
			this.parser.pos = match.index + match[0].length;
		}
	}
	return undefined;
};
