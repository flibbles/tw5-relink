/*\
module-type: relinkmarkdownrule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/codeinline.js
type: application/javascript

Handles markdown `code` and ``code``.

\*/

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
		this.parser.pos = match.index + match[0].length;
	}
	return undefined;
};
