/*\
module-type: relinkmarkdowntextrule

Handles markdown links

[caption](#link)

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");

function MarkdownLinkEntry() {};
MarkdownLinkEntry.prototype.name = "markdownlink";
MarkdownLinkEntry.prototype.report = function() {
	return ["[" + this.caption + "](#)"];
};

exports.name = "markdownlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /\[([^\]]+)\]\(#/mg;
};

exports.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	if (this.match) {
		this.close = this.indexOfClose(this.parser.source, this.match.index + this.match[0].length);
		if (this.close >= 0) {
			return this.match.index;
		}
	}
	return undefined;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry, m = this.match;
	var title = text.substring(this.match.index + this.match[0].length, this.close);
	this.parser.pos = this.close+1;
	if (title === utils.encodeLink(fromTitle)) {
		var entry = new MarkdownLinkEntry();
		entry.caption = m[1];
		entry.output = this.makeLink(toTitle, m[1], options);
		if (entry.output === undefined) {
			entry.impossible = true;
		}
	}
	return entry;
};

exports.makeLink = function(title, caption, options) {
	return "[" + caption + "](#" + utils.encodeLink(title) + ")";
};

exports.indexOfClose = function(text, pos) {
	var close = pos,
		open = pos;
	do {
		close = text.indexOf(')', close+1);
		if (close < 0) {
			return -1;
		}
		open = text.indexOf('(', open+1);
	} while (open >= 0 && open <= close);
	return close;
};
